import asyncio
import os
import io
import tempfile
from PIL import Image
from typing import List, Any, Union
from dotenv import load_dotenv

from llama_index.utils.workflow import draw_all_possible_flows
from llama_index.multi_modal_llms.gemini import GeminiMultiModal
from llama_index.embeddings.gemini import GeminiEmbedding
from llama_index.core.multi_modal_llms.generic_utils import load_image_urls

from llama_index.core.embeddings import BaseEmbedding
from llama_index.core.workflow import (
    step,
    Context,
    Workflow,
    Event,
    StartEvent,
    StopEvent,
)

from phoenix.otel import register
from openinference.instrumentation.llama_index import LlamaIndexInstrumentor

from sqlalchemy import create_engine
from sqlalchemy.engine import Connection

import boto3
from botocore.config import Config

from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By


async def run(query: str):
    load_dotenv()
    llm = GeminiMultiModal(model_name="models/gemini-1.5-flash-latest")
    embed_model = GeminiEmbedding(model="text-embedding-004")

    tracer_provider = register(project_name="spider")
    LlamaIndexInstrumentor().instrument(tracer_provider=tracer_provider)

    engine = create_engine(os.getenv("DATABASE_URL"))
    db = engine.connect()

    selenium = webdriver.Chrome()
    selenium.set_window_size(1920, 1080)
    selenium.get("https://www.google.com")

    workflow = SpiderPipeline(
        query=query,
        llm=llm,
        embed_model=embed_model,
        db=db,
        selenium=selenium,
        verbose=True,
        timeout=10240.0,
    )
    draw_all_possible_flows(workflow, filename="spider_pipeline.html")
    await workflow.run()

    db.close()


class ActionContextCreatedEvent(Event):
    context: List[str]


class ActionCreatedEvent(Event):
    action: str


class CompletePipelineEvent(Event):
    pass


class SpiderPipeline(Workflow):
    def __init__(
        self,
        *args: Any,
        query: str,
        llm: GeminiMultiModal,
        embed_model: BaseEmbedding,
        db: Connection,
        selenium: webdriver.Chrome,
        **kwargs: Any,
    ) -> None:
        super().__init__(*args, **kwargs)
        self.query = query
        self.llm = llm
        self.embed_model = embed_model
        self.db = db
        self.selenium = selenium
        self.visited_urls: set[str] = set()

        self.s3_client = boto3.client(
            "s3",
            endpoint_url=os.getenv("R2_ENDPOINT_URL"),
            aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
            region_name=os.getenv("R2_DEFAULT_REGION"),
            config=Config(signature_version="s3v4"),
        )
        self.bucket_name = "spider"

    @step
    async def query_past_request_clues(
        self, ctx: Context, ev: StartEvent
    ) -> ActionContextCreatedEvent:
        embedding = self.embed_model.get_text_embedding(self.query)
        # results = self.db.execute(
        #     select(Request).where(
        #         func.cosine_similarity(Request.embedding, embedding) > 0.5
        #     )
        # )
        return ActionContextCreatedEvent(context=[])

    @step
    async def create_action(
        self, ctx: Context, ev: ActionContextCreatedEvent
    ) -> Union[ActionCreatedEvent, CompletePipelineEvent]:
        WebDriverWait(self.selenium, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )

        screenshot_path = tempfile.mktemp(suffix=".png")
        self.selenium.save_screenshot(screenshot_path)

        with Image.open(screenshot_path) as img:
            width, height = img.size
            resized_img = img.resize((width // 3, height // 3), Image.LANCZOS)

            buffer = io.BytesIO()
            resized_img.save(buffer, format="PNG")
            buffer.seek(0)

        file_name = f"screenshots/{os.path.basename(screenshot_path)}"
        self.s3_client.upload_fileobj(buffer, self.bucket_name, file_name)

        presigned_url = self.s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": file_name},
            ExpiresIn=360,
        )

        print(presigned_url)
        image_documents = load_image_urls([presigned_url])

        response = self.llm.complete(
            prompt=f"See this image. Please create an action to take us closer to the user's goal: {self.query}. If we're done, say 'done'.",
            image_documents=image_documents,
        )
        action = response.text

        os.remove(screenshot_path)

        if action.lower().startswith("done"):
            return CompletePipelineEvent()
        else:
            return ActionCreatedEvent(action=action)

    @step
    async def take_action(
        self, ctx: Context, ev: ActionCreatedEvent
    ) -> ActionContextCreatedEvent:
        self.selenium.execute_script(ev.action)
        return ActionContextCreatedEvent(context=[])

    async def record_pipeline(self):
        await asyncio.sleep(5)
        pass

    @step
    async def complete_pipeline(
        self, ctx: Context, ev: CompletePipelineEvent
    ) -> StopEvent:
        self.selenium.quit()

        asyncio.create_task(self.record_pipeline())

        return StopEvent()


if __name__ == "__main__":
    asyncio.run(run("What is the weather in Tokyo?"))
