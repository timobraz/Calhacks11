import asyncio
import os
import json
import tempfile
from dotenv import load_dotenv

from phoenix.otel import register
from openinference.instrumentation.vertexai import VertexAIInstrumentor
from opentelemetry import trace

import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig, Part
from vertexai.language_models import TextEmbeddingInput, TextEmbeddingModel

from sqlalchemy import create_engine
from sqlalchemy.engine import Connection

from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

from prompts import SCHEMA


class SpiderPipeline:
    def __init__(self):
        load_dotenv()
        tracer_provider = register(project_name="spider")
        VertexAIInstrumentor().instrument(tracer_provider=tracer_provider)

        vertexai.init(location="us-central1")

        self.generation_config = GenerationConfig(
            max_output_tokens=1024,
            temperature=1,
            top_p=0.95,
            response_schema=SCHEMA,
            response_mime_type="application/json",
        )

        self.dimensionality = 256
        self.vector_embedding_task = "RETRIEVAL_DOCUMENT"

        self.llm = GenerativeModel("gemini-1.5-flash-002")
        self.embed_model = TextEmbeddingModel.from_pretrained("text-embedding-004")

        engine = create_engine(os.getenv("DATABASE_URL"))
        self.db = engine.connect()

        self.selenium = webdriver.Chrome()
        self.selenium.set_window_size(1920, 1080)
        self.selenium.get("https://www.google.com")

    async def run(self, query: str):

        tracer = trace.get_tracer(__name__)

        with tracer.start_as_current_span("spider_pipeline"):
            inputs = [
                TextEmbeddingInput(text, self.vector_embedding_task) for text in [query]
            ]
            embeddings = self.embed_model.get_embeddings(
                inputs, output_dimensionality=self.dimensionality
            )

            while True:
                with tracer.start_as_current_span("take_screenshot"):
                    WebDriverWait(self.selenium, 10).until(
                        EC.presence_of_element_located((By.TAG_NAME, "body"))
                    )

                    screenshot_path = tempfile.mktemp(suffix=".png")
                    self.selenium.save_screenshot(screenshot_path)

                    # image = Image.open(screenshot_path).resize((1920 // 2, 1080 // 2))

                    image_part = Part.from_data(
                        mime_type="image/png", data=open(screenshot_path, "rb").read()
                    )

                response = self.llm.generate_content(
                    [
                        f"""See this image. Please create an action to take us closer to the user's goal: {query}. If we're done, say 'done'.""",
                        image_part,
                    ],
                    generation_config=self.generation_config,
                    stream=False,
                )

                os.remove(screenshot_path)

                if "done" in response.text.lower():
                    break

            self.selenium.quit()

        asyncio.create_task(self.record_pipeline())

    async def record_pipeline(self):
        await asyncio.sleep(5)
        pass


if __name__ == "__main__":
    pipeline = SpiderPipeline()
    asyncio.run(pipeline.run("What is the weather in Tokyo?"))
