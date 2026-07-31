"""
Defines the abstract interface for all dataset loaders.
"""

from abc import ABC, abstractmethod
import pandas as pd

class BaseLoader(ABC):
    """
    Abstract base class for all dataset loaders. Every loader must implement the load() method and return a pandas DataFrame.
    """
    @abstractmethod
    def load(self, file_path: str) -> pd.DataFrame: #Load a dataset from the given file path.
        pass