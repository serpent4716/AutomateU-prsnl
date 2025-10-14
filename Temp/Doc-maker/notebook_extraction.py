import nbformat
import os


def extract_code_from_ipynb_nbformat(notebook_path: str) -> list[str]:
    """
    Extracts source code from all code cells in a Jupyter Notebook using nbformat.

    Args:
      notebook_path: The path to the .ipynb file.

    Returns:
      A list of strings, where each string is the code
      from one code cell. Returns an empty list if the
      file cannot be read or if no code cells are found.
      Raises FileNotFoundError if the path does not exist.
      Raises nbformat.validator.NotebookValidationError if the notebook is invalid.
    """
    if not os.path.exists(notebook_path):
        raise FileNotFoundError(f"Error: Notebook file not found at {notebook_path}")

    code_cells_source = []
    try:
        # Read the notebook using nbformat
        with open(notebook_path, 'r', encoding='utf-8') as f:
            notebook = nbformat.read(f, as_version=nbformat.NO_CONVERT) # Read without converting format

        # Iterate through each cell in the notebook
        for cell in notebook.cells:
            # Check if the cell type is 'code'
            if cell.cell_type == 'code':
                # Append the source code to the list
                if cell.source.strip(): # Add only if not empty
                    code_cells_source.append(cell.source)

    except nbformat.validator.NotebookValidationError as e:
        print(f"Error: Invalid notebook format in {notebook_path}: {e}")
        raise # Re-raise the exception
    except Exception as e:
        print(f"An unexpected error occurred while processing {notebook_path}: {e}")
        # Optionally re-raise or return empty list depending on desired error handling
        # raise e
        return []

    return code_cells_source

