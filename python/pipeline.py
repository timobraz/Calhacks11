import asyncio
import os
import io
import json
import tempfile
import numpy as np
from typing import List
from dotenv import load_dotenv
from PIL import Image
from phoenix.otel import register
from openinference.instrumentation.vertexai import VertexAIInstrumentor
from opentelemetry import trace
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig, Part
from vertexai.language_models import TextEmbeddingInput, TextEmbeddingModel

from kafka import KafkaProducer, KafkaConsumer
import base64

from sqlalchemy import create_engine, text

from selenium_driver import SeleniumDriver
from prompts import (
    GENERIC_SUBGOALS_PROMPT,
    GENERIC_SUBGOALS_SCHEMA,
    GENERIC_GOAL_PROMPT,
    GENERIC_GOAL_SCHEMA,
    SPECIFIC_PLAN_PROMPT,
    SPECIFIC_PLAN_SCHEMA,
    MANUAL_SUBGOAL_PROMPT,
    MANUAL_SUBGOAL_SCHEMA,
    ASK_USER_PROMPT,
    ASK_USER_SCHEMA,
    ENHANCE_SUBGOAL_PROMPT,
    SUBGOAL_ANALYSIS_PROMPT,
    SUBGOAL_ANALYSIS_SCHEMA,
)


def normalize_embedding(embedding: List[float]) -> List[float]:
    embedding_values = np.array(embedding)
    norm = np.linalg.norm(embedding_values)
    if norm == 0:
        return embedding_values.tolist()
    else:
        return (embedding_values / norm).tolist()


class SpiderPipeline:
    def __init__(self):
        load_dotenv()
        tracer_provider = register(project_name="spider")
        VertexAIInstrumentor().instrument(tracer_provider=tracer_provider)

        vertexai.init(location="us-central1")

        self.dimensionality = 256
        self.vector_embedding_task = "RETRIEVAL_DOCUMENT"

        self.llm_experimental = GenerativeModel("gemini-flash-experimental")
        self.pro_experimental = GenerativeModel("gemini-pro-experimental")
        self.llm = GenerativeModel("gemini-1.5-flash-002")
        self.pro = GenerativeModel("gemini-1.5-pro-002")
        self.embed_model = TextEmbeddingModel.from_pretrained("text-embedding-004")

        engine = create_engine(
            os.getenv("DATABASE_URL"),
            json_serializer=json.dumps,
            json_deserializer=json.loads,
        )
        self.db = engine.connect()

        self.selenium_driver = SeleniumDriver()

    async def take_screenshots(
        self, producer: KafkaProducer | None = None, uuid: str | None = None
    ):
        while True:
            screenshot_path = tempfile.mktemp(suffix=".png")
            self.selenium_driver.save_screenshot(screenshot_path)
            image = Image.open(screenshot_path)
            image = image.resize((image.width // 5, image.height // 5))
            image.save(screenshot_path)
            image_bytes = open(screenshot_path, "rb").read()
            base64_image = base64.b64encode(image_bytes).decode("utf-8")
            print("SENDING PREVIEW to ", uuid)
            producer.send(
                uuid,
                bytes(
                    json.dumps(
                        {
                            "message": f"screenshot taken",
                            "preview": base64_image,
                            "display": False,
                        }
                    ),
                    "utf-8",
                ),
            )
            await asyncio.sleep(2)

    async def navigate(
        self, url: str, producer: KafkaProducer | None = None, uuid: str | None = None
    ):
        print("NAVIGATING TO", url)
        try:
            self.selenium_driver.get(url)
            producer.send(
                uuid,
                json.dumps(
                    {
                        "message": f"Navigated to {url}",
                        "preview": None,
                        "display": True,
                    }
                ).encode("utf-8"),
            )
        except Exception as e:
            print("ERROR NAVIGATING TO", url, e)

    async def send_message(
        self,
        producer: KafkaProducer | None = None,
        uuid: str | None = None,
        message: str = "",
    ):
        producer.send(uuid, message.encode("utf-8"))

    async def run(
        self,
        query: str,
        producer: KafkaProducer | None = None,
        consumer: KafkaConsumer | None = None,
        uuid: str | None = None,
    ):

        tracer = trace.get_tracer(__name__)

        with tracer.start_as_current_span("spider_pipeline"):
            with tracer.start_as_current_span("create generic subgoals"):
                task1 = asyncio.to_thread(
                    self.pro_experimental.generate_content,
                    [GENERIC_SUBGOALS_PROMPT(query)],
                    generation_config=GenerationConfig(
                        max_output_tokens=1024,
                        # top_p=0.95,
                        temperature=0.2,
                        response_schema=GENERIC_SUBGOALS_SCHEMA,
                        response_mime_type="application/json",
                    ),
                    stream=False,
                )

                task2 = asyncio.to_thread(
                    self.llm.generate_content,
                    [GENERIC_GOAL_PROMPT(query)],
                    generation_config=GenerationConfig(
                        max_output_tokens=1024,
                        # top_p=0.95,
                        temperature=0.0,
                        response_schema=GENERIC_GOAL_SCHEMA,
                        response_mime_type="application/json",
                    ),
                    stream=False,
                )

                responses = await asyncio.gather(task1, task2)
                generic_subgoals = json.loads(responses[0].text)["subgoals"]
                generic_goal = json.loads(responses[1].text)["goal"]

                print(generic_subgoals)
                print(generic_goal)

            with tracer.start_as_current_span("embed subgoals"):
                all_embed_inputs = [*generic_subgoals, generic_goal]
                inputs = [
                    TextEmbeddingInput(subgoal, self.vector_embedding_task)
                    for subgoal in all_embed_inputs
                ]
                embeddings = self.embed_model.get_embeddings(
                    inputs, output_dimensionality=self.dimensionality
                )
                generic_subgoal_embeddings = embeddings[:-1]
                generic_goal_embedding = embeddings[-1]

            with tracer.start_as_current_span("query subgoal memory"):
                normalized_generic_subgoal_embeddings = [
                    normalize_embedding(embedding.values)
                    for embedding in generic_subgoal_embeddings
                ]
                normalized_generic_goal_embedding = normalize_embedding(
                    generic_goal_embedding.values
                )

                similar_generic_subgoals = []
                for subgoal_embedding in [
                    *normalized_generic_subgoal_embeddings,
                    normalized_generic_goal_embedding,
                ]:
                    subgoal_embedding_json = json.dumps(subgoal_embedding)

                    result = self.db.execute(
                        text(
                            """
                            SELECT *, embedding <*> :subgoal_embedding AS cosine_similarity
                            FROM subgoal_memory
                            WHERE (embedding <*> :subgoal_embedding) > 0.9
                            ORDER BY cosine_similarity DESC
                            LIMIT 2
                            """
                        ),
                        {"subgoal_embedding": subgoal_embedding_json},
                    )
                    similar_subgoals = result.fetchall()
                    similar_generic_subgoals.extend(similar_subgoals)

                clues = []
                for row in similar_generic_subgoals:
                    clues.append(
                        {
                            "subgoal_text": row["subgoal_text"],
                            "steps_taken": row["steps_taken"],
                            "cosine_similarity": row["cosine_similarity"],
                        }
                    )

            with tracer.start_as_current_span("create plan"):
                response = self.llm_experimental.generate_content(
                    [SPECIFIC_PLAN_PROMPT(generic_subgoals, clues, query)],
                    generation_config=GenerationConfig(
                        max_output_tokens=1024,
                        # top_p=0.95,
                        temperature=0.0,
                        response_schema=SPECIFIC_PLAN_SCHEMA,
                        response_mime_type="application/json",
                    ),
                    stream=False,
                )
                subgoals = json.loads(response.text)["subgoals"]

            extra_hints = []
            bad_tries = []
            new_subgoals = []
            with tracer.start_as_current_span("execute plan"):
                i = 0
                while i < len(subgoals):
                    with tracer.start_as_current_span("take before subgoal screenshot"):
                        self.selenium_driver.wait_until_loaded()

                        before_subgoal_screenshot_path = tempfile.mktemp(suffix=".png")
                        self.selenium_driver.save_screenshot(
                            before_subgoal_screenshot_path
                        )

                        with Image.open(before_subgoal_screenshot_path) as img:
                            img = img.resize((1440 // 2, 1080 // 2))
                            buffer = io.BytesIO()
                            img.save(buffer, format="JPEG", optimize=True, quality=75)
                            compressed_before_subgoal_image_data = buffer.getvalue()

                        before_subgoal_image_part = Part.from_data(
                            mime_type="image/jpeg",
                            data=compressed_before_subgoal_image_data,
                        )

                    subgoal_is_new = False
                    if subgoals[i]["subgoalType"] == "unknownSteps":
                        subgoal_is_new = True
                        with tracer.start_as_current_span("generate manual action"):
                            response = self.pro.generate_content(
                                [
                                    MANUAL_SUBGOAL_PROMPT(
                                        [
                                            (
                                                subgoal["subgoal"]["subgoal"]
                                                if subgoal["subgoalType"] != "complete"
                                                else ""
                                            )
                                            for subgoal in subgoals
                                        ],
                                        subgoals[i]["subgoal"]["subgoal"],
                                        query,
                                        self.selenium_driver.extract_significant_elements(),
                                        extra_hints,
                                        bad_tries,
                                    ),
                                    before_subgoal_image_part,
                                ],
                                generation_config=GenerationConfig(
                                    max_output_tokens=1024,
                                    # top_p=0.95,
                                    temperature=0.8,
                                    response_schema=MANUAL_SUBGOAL_SCHEMA,
                                    response_mime_type="application/json",
                                ),
                                stream=False,
                            )

                            response_content = json.loads(response.text)
                            subgoals[i]["subgoal"] = response_content["subgoal"]

                    print("ACTION", response_content)

                    if producer:
                        producer.send(
                            uuid,
                            json.dumps(
                                {"info": response_content, "display": True}
                            ).encode("utf-8"),
                        )

                    needs_user_input = False
                    with tracer.start_as_current_span(
                        "determine if user input required"
                    ):
                        response = self.pro_experimental.generate_content(
                            [
                                ASK_USER_PROMPT(subgoals[i]["subgoal"], extra_hints),
                                before_subgoal_image_part,
                            ],
                            generation_config=GenerationConfig(
                                max_output_tokens=1024,
                                # top_p=0.95,
                                temperature=0.0,
                                response_schema=ASK_USER_SCHEMA,
                                response_mime_type="application/json",
                            ),
                            stream=False,
                        )

                        response_content = json.loads(response.text)
                        needs_user_input = response_content["needsUserInput"]
                        question = response_content.get("question")

                    if needs_user_input:
                        with tracer.start_as_current_span("ask user for input"):
                            if producer:
                                producer.send(
                                    uuid,
                                    json.dumps(
                                        {"question": question, "display": True}
                                    ).encode("utf-8"),
                                )

                                for message in consumer:
                                    answer = json.loads(message.value).get("answer")
                                    if answer:
                                        extra_hints.append(
                                            f"question: {question}, answer: {answer}"
                                        )
                                        break
                            else:
                                answer = input(question)
                                extra_hints.append(
                                    f"question: {question}, answer: {answer}"
                                )

                        with tracer.start_as_current_span(
                            "enhance subgoal with user input"
                        ):
                            response = self.llm.generate_content(
                                [
                                    ENHANCE_SUBGOAL_PROMPT(
                                        subgoals[i]["subgoal"], extra_hints
                                    ),
                                ],
                                generation_config=GenerationConfig(
                                    max_output_tokens=1024,
                                    # top_p=0.95,
                                    temperature=0.0,
                                    response_schema=MANUAL_SUBGOAL_SCHEMA,
                                    response_mime_type="application/json",
                                ),
                                stream=False,
                            )

                            response_content = json.loads(response.text)
                            subgoals[i]["subgoal"] = response_content["subgoal"]

                    steps = subgoals[i]["subgoal"]["steps"]

                    try:
                        with tracer.start_as_current_span("execute subgoal steps"):
                            for step in steps:
                                action_type = step["stepType"]
                                details = step["stepDetails"]

                                self.selenium_driver.wait_until_loaded()

                                if action_type == "googleSearch":
                                    self.selenium_driver.search_google(details["query"])

                                elif action_type == "click":
                                    self.selenium_driver.click(
                                        details["xpath"],
                                        details.get("mouse_action", "left_click"),
                                        details.get("text"),
                                    )

                                elif action_type == "input":
                                    self.selenium_driver.input(
                                        details["xpath"], details["text"]
                                    )

                                elif action_type == "scroll":
                                    self.selenium_driver.scroll(
                                        details["direction"], details["amount"]
                                    )

                                elif action_type == "wait":
                                    self.selenium_driver.wait(details["duration"])

                                else:
                                    print(f"Unknown action type: {action_type}")

                        await asyncio.sleep(2)
                        self.selenium_driver.wait_until_loaded()

                        with tracer.start_as_current_span(
                            "take after subgoal screenshot"
                        ):
                            self.selenium_driver.wait_until_loaded()

                            after_subgoal_screenshot_path = tempfile.mktemp(
                                suffix=".png"
                            )
                            self.selenium_driver.save_screenshot(
                                after_subgoal_screenshot_path
                            )

                            with Image.open(after_subgoal_screenshot_path) as img:
                                img = img.resize((1440 // 2, 1080 // 2))
                                buffer = io.BytesIO()
                                img.save(
                                    buffer, format="JPEG", optimize=True, quality=75
                                )
                                compressed_after_subgoal_image_data = buffer.getvalue()

                            after_subgoal_image_part = Part.from_data(
                                mime_type="image/jpeg",
                                data=compressed_after_subgoal_image_data,
                            )

                        with tracer.start_as_current_span("analyze subgoal"):
                            response = self.pro_experimental.generate_content(
                                [
                                    SUBGOAL_ANALYSIS_PROMPT(
                                        [
                                            (
                                                subgoal["subgoal"]["subgoal"]
                                                if subgoal["subgoalType"] != "complete"
                                                else ""
                                            )
                                            for subgoal in subgoals
                                        ],
                                        subgoals[i]["subgoal"]["subgoal"],
                                        query,
                                    ),
                                    before_subgoal_image_part,
                                    after_subgoal_image_part,
                                ],
                                generation_config=GenerationConfig(
                                    max_output_tokens=1024,
                                    # top_p=0.95,
                                    temperature=0.0,
                                    response_schema=SUBGOAL_ANALYSIS_SCHEMA,
                                    response_mime_type="application/json",
                                ),
                                stream=False,
                            )
                            subgoal_analysis = json.loads(response.text)

                            if subgoal_analysis["subgoal_complete"]:
                                if subgoal_is_new:
                                    new_subgoals.append(subgoals[i])

                                i += 1
                                bad_tries = []

                                if subgoal_analysis["goal_complete"]:
                                    break

                    except Exception as e:
                        print("Error executing subgoal steps", e)
                        bad_tries.append(subgoals[i]["subgoal"])

            print("final screenshot", after_subgoal_screenshot_path)

            with tracer.start_as_current_span("cache new subgoals"):
                generic_new_subgoals = [
                    asyncio.to_thread(
                        self.llm.generate_content,
                        [GENERIC_GOAL_PROMPT(subgoal["subgoal"]["subgoal"])],
                        generation_config=GenerationConfig(
                            max_output_tokens=1024,
                            temperature=1.0,
                            response_schema=GENERIC_GOAL_SCHEMA,
                            response_mime_type="application/json",
                        ),
                    )
                    for subgoal in new_subgoals
                ]

                generic_new_subgoals_responses = await asyncio.gather(
                    *generic_new_subgoals
                )

                generic_new_subgoal_embeddings = self.embed_model.get_embeddings(
                    [
                        TextEmbeddingInput(
                            json.loads(subgoal.text)["goal"],
                            self.vector_embedding_task,
                        )
                        for subgoal in generic_new_subgoals_responses
                    ],
                    output_dimensionality=self.dimensionality,
                )

                normalized_generic_new_subgoal_embeddings = [
                    normalize_embedding(embedding.values)
                    for embedding in generic_new_subgoal_embeddings
                ]

                for i, (subgoal, embedding) in enumerate(
                    zip(
                        generic_new_subgoals_responses,
                        normalized_generic_new_subgoal_embeddings,
                    )
                ):
                    embedding_json = json.dumps(embedding)

                    self.db.execute(
                        text(
                            """
                            INSERT INTO subgoal_memory (embedding, subgoal_text, steps_taken)
                            VALUES (:embedding, :subgoal_text, :steps_taken)
                            """
                        ),
                        {
                            "embedding": embedding_json,
                            "subgoal_text": json.loads(subgoal.text)["goal"],
                            "steps_taken": json.dumps(subgoals[i]["subgoal"]["steps"]),
                        },
                    )

    async def reset(self):
        self.selenium_driver.reset()


if __name__ == "__main__":
    pipeline = SpiderPipeline()
    asyncio.run(pipeline.run("download vscode"))
