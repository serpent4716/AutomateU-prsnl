import google.generativeai as genai
import json
import textwrap

def summary_gen(text: str, length: str = 'medium') -> dict:
    """
    Generates a quiz by calling the Gemini API and parses the JSON response.
    """
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    config = genai.types.GenerationConfig(
        # response_mime_type="application/json", # Use this to enforce JSON output!
        temperature=0.2,
        max_output_tokens=1500
    )

    prompt = build_prompt(text, length)
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=config
        )
        
        data = response.text.strip()
    except Exception as e:
        # Handle other potential API errors (e.g., network, authentication)
        raise RuntimeError(f"An error occurred during API call: {e}")

    return data


def build_prompt(content: str, length: str) -> str:
    """
    Builds the token-efficient prompt for the LLM.
    Removes leading whitespace for token efficiency.
    """
    prompt_template = f"""
        You are a text summarization assistant. Your task is to create accurate, concise summaries of provided texts.

        ## Rules
        1. **Stay faithful**: Only include information from the source text
        2. **Be concise**: Extract main ideas and key points only
        3. **Stay neutral**: No opinions or commentary
        4. **Be clear**: Use simple, direct language

        ## Default Format
        - Lead with the main idea
        - Include 2-4 key supporting points
        - One paragraph unless otherwise requested
        - Match the original's tone (formal/casual, technical/general)

        ## Adapt length based on request:
        - Brief: 2-3 sentences (main idea only)
        - Standard: 1 paragraph (main points + key details)
        - Detailed: Multiple paragraphs (comprehensive coverage)

        Focus on what matters most to understanding the text's core message.
        Lenght requested: {length}
        Here is the text to summarize:
        {content}
    """
    
    dedented_template = textwrap.dedent(prompt_template)

    return dedented_template
