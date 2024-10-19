SCHEMA = {
    "description": "Instructions based on the given input and prompt using a screenshot.",
    "type": "object",
    "properties": {
        "input": {
            "type": "string",
            "description": "Text input describing the context or content of the screenshot.",
            "nullable": False,
        },
        "taskPrompt": {
            "type": "string",
            "description": "Text prompt describing the task to be performed based on the screenshot.",
            "nullable": False,
        },
        "instructions": {
            "type": "array",
            "description": "A list of instructions to complete the task using the screenshot.",
            "items": {
                "type": "object",
                "properties": {
                    "stepNumber": {
                        "type": "integer",
                        "description": "The number indicating the step order.",
                        "nullable": False,
                    },
                    "action": {
                        "type": "string",
                        "description": "The action to be taken in this step.",
                        "nullable": False,
                    },
                    "details": {
                        "type": "string",
                        "description": "Additional details or information for this step.",
                        "nullable": True,
                    },
                    "confidence": {
                        "type": "number",
                        "description": "Confidence score for this instruction (0-1).",
                        "nullable": False,
                    },
                },
                "required": ["stepNumber", "action", "confidence"],
            },
        },
        "reasoning": {
            "type": "string",
            "description": "Explanation of the model's thought process.",
            "nullable": False,
        },
        "alternatives": {
            "type": "array",
            "description": "Alternative approaches to complete the task.",
            "items": {
                "type": "string",
            },
        },
        "nextSteps": {
            "type": "array",
            "description": "Suggested follow-up actions.",
            "items": {
                "type": "string",
            },
        },
    },
    "required": [
        "input",
        "taskPrompt",
        "instructions",
        "reasoning",
        "alternatives",
        "nextSteps",
    ],
}
