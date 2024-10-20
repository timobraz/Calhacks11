from typing import List


def GENERIC_SUBGOALS_PROMPT(goal: str):
    return f"""
    We have access to only a search engine with Google. Please create a list of generic subgoals to achieve this goal: `{goal}`, without any personally identifiable details. Each subgoal is a single action. Each subgoal should cause no more than a single visual change on the page.

    Each subgoal can make use of one or more of the following actions: ask_user, search, click, input, scroll, wait.

    We don't want to skip steps. However we can take multiple actions in a single subgoal if they are all related to the same page.

    SPECIFIC WEBSITE NAMES SHOULD BE INCLUDED IN THE SUBGOAL.

    Example 1:
    Goal: "Add Contact by Daft Punk to my Spotify playlist"
    Subgoals: ["Search for Spotify", "Click on the first search result", "Click the Spotify login button", "Input Spotify credentials and login", "Input the song name to the search bar and search", "Right click to expand the song options", "Click to add the song to my playlist"]

    Example 2:
    Goal: "Find the name of the person who played the character 'Neo' in The Matrix"
    Subgoals: ["Search for the requested movie", "Click on the 'Cast' tab", "Scroll to find the actor who played the requested character"]
    """


def GENERIC_GOAL_PROMPT(goal: str):
    return f"""
    We have access to only a search engine with Google. Please create a generic goal statement containing the semantic meaning of this goal: {goal}, but without any personally identifiable details.

    SPECIFIC WEBSITE NAMES SHOULD BE INCLUDED IN THE GOAL.
    """


GENERIC_SUBGOALS_SCHEMA = {
    "type": "object",
    "properties": {
        "subgoals": {
            "type": "array",
            "description": "A list of generic subgoals to achieve the user's goal.",
            "items": {"type": "string"},
        },
    },
}

GENERIC_GOAL_SCHEMA = {
    "type": "object",
    "properties": {
        "goal": {
            "type": "string",
            "description": "A generic version of the user's goal.",
        },
    },
}


SUBGOAL_STEP_SCHEMA = {
    "type": "object",
    "properties": {
        "stepType": {
            "type": "string",
            "enum": [
                "googleSearch",
                "click",
                "input",
                "scroll",
                "wait",
            ],
            "description": "The type of action to be taken in this step.",
        },
        "stepDetails": {
            "anyOf": [
                {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query to input into Google.",
                        },
                    },
                    "required": ["query"],
                    # "description": "A search query to input into Google. Must be used in conjunction with the 'search' action type. Do not use this to input text into an input field.",
                },
                {
                    "type": "object",
                    "properties": {
                        "xpath": {
                            "type": "string",
                            # "description": "XPath of the element to click. If this is not an XPath, I will kill you. If this is the word 'string', you will die. CONSIDER LOOKING AT THE HREF OR ARIA LABEL FOR THIS FIELD",
                        },
                        "mouse_action": {
                            "type": "string",
                            "enum": ["left_click", "right_click"],
                            # "description": "The type of mouse action to take.",
                        },
                        "text": {
                            "type": "string",
                            # "description": "Text content of the element to click (optional).",
                        },
                    },
                    "required": ["xpath"],
                    # "description": "XPath of the element to click. Must be used in conjunction with the 'click' action type. If this is not an XPath, I will kill you.",
                },
                # {
                #     "type": "object",
                #     "properties": {
                #         "xpath": {
                #             "type": "string",
                #             "description": "XPath of the input element. If this is not an XPath, I will kill you. If this is the word 'string', you will die. CONSIDER LOOKING AT THE PLACEHOLDER TEXT FOR THIS FIELD",
                #         },
                #         "text": {
                #             "type": "string",
                #             "description": "Text to input into the element, use this to input text into a text input field.",
                #         },
                #     },
                #     "required": ["xpath", "text"],
                #     "description": "XPath of the input element to input text into. Must be used in conjunction with the 'input' action type. If this is not an XPath, I will kill you.",
                # },
                {
                    "type": "object",
                    "properties": {
                        "direction": {
                            "type": "string",
                            "enum": ["up", "down"],
                            "description": "Direction to scroll.",
                        },
                        "amount": {
                            "type": "string",
                            "description": "Amount to scroll (e.g., '100px', '50%', 'full').",
                        },
                    },
                    "required": ["direction", "amount"],
                    "description": "Direction and amount to scroll. Must be used in conjunction with the 'scroll' action type.",
                },
                {
                    "type": "object",
                    "properties": {
                        "duration": {
                            "type": "number",
                            "description": "Time to wait in milliseconds.",
                        },
                    },
                    "required": ["duration"],
                    "description": "Time to wait in milliseconds. Must be used in conjunction with the 'wait' action type.",
                },
            ],
        },
    },
    "description": "A tagged union of different possible actions to take on this page to achieve the user's goal based on only the provided context.",
    "required": ["stepType", "stepDetails"],
}

KNOWN_STEPS_SCHEMA = {
    "type": "object",
    "properties": {
        "subgoal": {
            "type": "string",
            "description": "The subgoal we are currently working on.",
        },
        "steps": {
            "type": "array",
            "description": "A list of steps to perform, in order, beginning from the provided state and going no further than one page further.",
            "items": SUBGOAL_STEP_SCHEMA,
        },
    },
    "required": ["subgoal", "steps"],
    "description": "A list of steps to perform, in order, beginning from the provided state and going no further than one page further. Must be used in conjunction with the 'knownSteps' subgoalType.",
}

UNKNOWN_STEPS_SCHEMA = {
    "type": "object",
    "properties": {
        "subgoal": {
            "type": "string",
            "description": "A subgoal to achieve, in order, to achieve the user's goal.",
        },
    },
    "required": ["subgoal"],
    "description": "A subgoal to achieve, in order, to achieve the user's goal. Must be used in conjunction with the 'unknownSteps' subgoalType.",
}

COMPLETE_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
            "description": "High-level summary of the actions performed and the result.",
        },
    },
    "required": ["summary"],
    "description": "High-level summary of the actions performed and the result. Must be used in conjunction with the 'complete' subgoalType.",
}

SUBGOAL_DESCRIPTION_SCHEMA = {
    "type": "string",
    "description": "Explanation of the model's thought process.",
}

AUTOMATIC_SUBGOAL_SCHEMA = {
    "description": "A tagged union of different possible actions to take on this page to achieve the user's goal based on only the provided context.",
    "type": "object",
    "properties": {
        "subgoalType": {
            "type": "string",
            "description": "'knownSteps' if there are more actions to take, 'unknownSteps' if we don't know what the next action is. Do not make up steps.",
            "enum": ["knownSteps", "unknownSteps"],
        },
        "subgoal": {
            "anyOf": [
                KNOWN_STEPS_SCHEMA,
                UNKNOWN_STEPS_SCHEMA,
            ],
        },
    },
    "required": [
        "subgoalType",
        "subgoal",
    ],
}


def ASK_USER_PROMPT(subgoal: dict, extra_hints: List[str]):
    return f"""
    The following is a specification for an operation that will be performed on a web page.

    {subgoal}

    Does this operation contain the term 'example'? If so, provide the question that will be asked of the user to provide the necessary input. 

    IF YOU SET needsUserInput = true, YOU MUST PROVIDE A QUESTION. IF YOU ERRONEOUSLY SET needsUserInput = true, YOU WILL DIE.

    THE USER CAN ONLY PROVIDE PERSONAL INFORMATION. DO NOT ASK FOR ANYTHING RELATED TO THE WEB BROWSER. ASSUME THE USER NEED NOT EVEN KNOW THE WEB BROWSER EXISTS.

    AS FOR ALL REQUIRED USER INPUTS AT ONCE.

    DO NOT FUCK AROUND AND SAY EVEN THOUGH EXAMPLE IS OPERATION WE STILL NEED USER INPUT. NO WE DON'T. SAY IT WITH ME. IF EXAMPLE IS NOT IN THE OPERATION, WE DO NOT NEED USER INPUT.
    """ + (
        f"""
    The following as some hints that may already provide the necessary inputs, if so, WE DO NOT NEED USER INPUT. IF THE PROVIDED HINTS FULFILL THE OPERATION, WE DO NOT NEED USER INPUT. DO NOT FUCK AROUND AND ASK FOR INPUT IN THIS CASE
    {extra_hints}
    """
        if len(extra_hints) > 0
        else ""
    )


ASK_USER_SCHEMA = {
    "type": "object",
    "properties": {
        "needsUserInput": {
            "type": "boolean",
        },
        "question": {"type": "string", "description": "The question to ask the user."},
        "explanation": {
            "type": "string",
            "description": "Explanation of the model's thought process.",
        },
    },
    "required": ["needsUserInput", "explanation"],
}


def ENHANCE_SUBGOAL_PROMPT(subgoal: dict, extra_hint: dict):
    return f"""
    The following is a specification for an operation that will be performed on a web page.

    {subgoal}

    This operation requires some user input. This input has been provided:

    {extra_hint}

    Please repeat the operation, but enhance it to include the user's input.
    """


def MANUAL_SUBGOAL_PROMPT(
    subgoals: List[str],
    subgoal: str,
    goal: str,
    cleaned_html: str,
    extra_hints: List[str],
    bad_tries: List[str],
):
    return (
        (
            f"""
    We have access to only a search engine with Google. Please create an action to take us closer to the user's goal: {goal}.
     
    This goal is made up of the following subgoals: {subgoals}.

    The subgoal we are completing at this stage is {subgoal}. 

    The actions we take should cause no more than a single visual change on this page. If we are done, respond with "complete", and a summary of the actions performed and the result.

    Each subgoal can make use of one or more of the following actions: ask_user, search, click, input, scroll, wait.

    The following are some relevant CLEANED HTML ELEMENTS on the page, use these to create XPaths:
    {cleaned_html}

    DO NOT ATTEMPT TO LOG IN WITH GOOGLE. 

    REMEMBER TO INPUT TEXT INTO INPUT FIELDS IF NECESSARY.

    FEEL FREE TO TAKE MULTIPLE ACTIONS IN A SINGLE SUBGOAL IF THEY ARE ALL RELATED TO THE SAME PAGE. FOR EXAMPLE INPUTTING A USERNAME AND PASSWORD AND LOGGING IN CAN BE A SINGLE SUBGOAL. IN FACT, THIS IS PREFERRED.

    ASSUME THAT THE USER IS NOT LOGGED IN TO THE WEBSITE. 

    IF WE REQUIRE INFORMATION FROM THE USER, USE OBVIOUS EXAMPLE FIELDS. DO NOT MAKE UP USER CREDENTIALS. EXAMPLE FIELDS ARE INPUT FIELDS THAT MUST CONTAIN THE TERM 'example'. IF YOU FAIL AT THIS, I WILL KILL YOU.

    ### Example 1:
    **Subgoal**: "Google search for Spotify"
    **Output**:
    {{
        "steps": [
            {{
                "stepType": "googleSearch",
                "stepDetails": {{
                    "query": "Spotify"
                }}
            }},
        ]
    }}

    ### Example 2:
    **Subgoal**: "Click the Spotify login button"
    **Output**:
    {{
        "steps": [
            {{
                "stepType": "click",
                "stepDetails": {{
                    "xpath": "//a[contains(@href, 'open.spotify.com')]"
                }}
            }},
        ]
    }}
    **EXPLANATION**
    THIS IS PERFECT! IT'S A CLICKABLE ELEMENT WITH AN HREF ATTRIBUTE TO IDENTIFY IT. href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href href. aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label aria-label, title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title title, internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text internal text 

    ### Example 3:
    **Subgoal**: "Search for Contact by Daft Punk in Spotify"
    **Relevant HTML**
    Includes {{'class': 'Input-sc-1gbx9xe-0 jWDhBG encore-text-body-medium CVuGEUIxLkNKpMds8AFS', 'data-encore-id': 'formInput', 'data-testid': 'search-input', 'placeholder': 'What do you want to play?', 'spellcheck': 'false', 'tabindex': '0', 'type': 'search', 'value': ''}}
    **Output**:
    {{
        "steps": [
            {{
                "stepType": "input",
                "stepDetails": {{
                    "xpath": "//input[@placeholder='What do you want to play?",
                    "value": "Contact by Daft Punk"
                }}
            }},
        ]
    }}
    **EXPLANATION**
    THIS IS PERFECT! IT'S AN INPUT FIELD WITH A PLACEHOLDER TEXT TO IDENTIFY IT. placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder placeholder 

    """
            + f"\n\n The following is some additional information to help you complete this subgoal: {extra_hints}"
        )
        + """
        The following are subgoals that miserably failed: {bad_tries}
        DO NOT TRY THESE SAME STEPS AGAIN.
        """
        + """
        I CANNOT UNDERSTATE THE TROUBLE THAT WILL BECOME UPON YOU IF YOU SET xpath = 'string'. DO NOT FUCK AROUND AND GIVE ME A PATH OF DIVS AS AN XPATH. GIVE ME AN ELEMENT WITH AN HREF OR ARIA LABEL. OR GIVE ME AN INPUT FIELD WITH A PLACEHOLDER TEXT. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. USE THE HTML ELEMENTS TO CREATE THE XPATH. 
        """
        + (
            """
        YOU HAVE NOW FAILED THIS SUBGOAL MANY TIMES. REMEMBER THE GOAL: {goal}. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. CONSIDER THE STATE OF THE BROWSER. CONSIDER THE OVERALL GOAL. MODIFY THE SUBGOAL. 
        """
            if len(bad_tries) >= 2
            else ""
        )
    )


MANUAL_SUBGOAL_SCHEMA = {
    "description": "A tagged union of different possible actions to take on this page to achieve the user's goal based on only the provided context.",
    "type": "object",
    "properties": {
        "subgoal": KNOWN_STEPS_SCHEMA,
    },
    "required": [
        "subgoal",
    ],
}


def SPECIFIC_PLAN_PROMPT(subgoals: List[str], clues: List[str], query: str):
    return f"""
    Please create a specific plan to achieve the user's goal: "{query}".

    Using the following generic subgoals: {subgoals}.

    For certain subgoals, we have been provided with known steps to take. These are: {clues}.

    If we are not provided with known steps, we must choose `"unknownSteps"` for the `subgoalType`. Do not make up steps.

    ### Example:

    **Subgoals**:
    - "Search for Spotify"
    - "Click on the first Google search result"
    - "Click the Spotify login button"
    - "Input Spotify credentials and login"
    - "Input the song name to the Spotify search bar and search"
    - "Right click to expand the Spotify song options"
    - "Click to add the song to my Spotify playlist"

    **Clues**: []

    **Query**: "Add 'Contact' by Daft Punk to my Spotify playlist"

    **Output**:
    {{
        "subgoals": [
            {{
                "subgoalType": "unknownSteps",
                "subgoal": {{
                    "subgoal": "Search for Spotify"
                }},
            }},
            {{
                "subgoalType": "unknownSteps",
                "subgoal": {{
                    "subgoal": "Click on the first Google search result"
                }},
            }},
            {{
                "subgoalType": "unknownSteps",
                "subgoal": {{
                    "subgoal": "Click the Spotify login button"
                }},
            }},
            {{
                "subgoalType": "unknownSteps",
                "subgoal": {{
                    "subgoal": "Input Spotify credentials and login",
                }},
            }},
            {{
                "subgoalType": "unknownSteps",
                "subgoal": {{
                    "subgoal": "Input the song name to the Spotify search bar and search"
                }},
            }},
            {{
                "subgoalType": "unknownSteps",
                "subgoal": {{
                    "subgoal": "Right click to expand the Spotify song options"
                }},
            }},
            {{
                "subgoalType": "unknownSteps",
                "subgoal": {{
                    "subgoal": "Click to add the song to my Spotify playlist"
                }},
            }}
            {{
                "subgoalType": "complete",
                "subgoal": {{
                    "summary": "Added 'Contact' by Daft Punk to my Spotify playlist."
                }},
            }}
        ]
    }}
    """


SPECIFIC_PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "subgoals": {
            "type": "array",
            "description": "A list of subgoals to achieve, in order, to achieve the user's goal.",
            "items": AUTOMATIC_SUBGOAL_SCHEMA,
        },
    },
    "description": "A list of subgoals to achieve, in order, to achieve the user's goal.",
    "required": ["subgoals"],
}


def SUBGOAL_ANALYSIS_PROMPT(subgoals: List[str], subgoal: str, goal: str):
    return f"""
    We have access to only a search engine with Google. We are currently working on the following goal: {goal}.

    This goal is made up of the following subgoals: {subgoals}.

    The subgoal we are completing at this stage is: {subgoal}. 

    We have a before screenshot, and an after screenshot. 

    Please analyze if the subgoal is complete. If so, subgoal_complete = true.

    If the subgoal is complete, also check if the goal is complete. If so, goal_complete = true.
    """


SUBGOAL_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "subgoal_complete": {
            "type": "boolean",
            "description": "Whether the subgoal has been achieved.",
        },
        "goal_complete": {
            "type": "boolean",
            "description": "Whether the goal has been achieved.",
        },
    },
    "required": ["subgoal_complete", "goal_complete"],
}
