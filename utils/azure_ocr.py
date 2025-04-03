import os
import re
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from config import AZURE_ENDPOINT, AZURE_API_KEY

def extract_license_plate(image_path):
    """
    Extract license plate number from an image using Azure Document Intelligence
    with a custom trained "licensenumber" model only
    
    Args:
        image_path (str): Path to the image file
        
    Returns:
        str: Extracted license plate number or None if not found
    """
    # Initialize the Document Analysis client
    document_analysis_client = DocumentAnalysisClient(
        endpoint=AZURE_ENDPOINT, 
        credential=AzureKeyCredential(AZURE_API_KEY)
    )
    
    # Read the image file
    with open(image_path, "rb") as f:
        image_data = f.read()
    
    # Use only the custom license plate model
    try:
        # Analyze the image using the custom license plate model
        poller = document_analysis_client.begin_analyze_document("licensenumber", image_data)
        result = poller.result()
        
        # Try to get license plate from the custom model field
        if result.documents and len(result.documents) > 0:
            # Extract from the custom model's licensenumber field
            license_field = result.documents[0].fields.get("licensenumber")
            if license_field and license_field.value:
                plate_number = license_field.value.strip().upper()
                print(f"Custom model extracted license plate: {plate_number}")
                return standardize_plate_format(plate_number)
        
        # If we didn't get a result from the custom model fields
        print("No license plate detected by custom model")
        return None
    
    except Exception as e:
        print(f"Error with custom model: {str(e)}")
        return None

def standardize_plate_format(plate):
    """
    Standardize the format of the license plate number
    
    Args:
        plate (str): The license plate number
        
    Returns:
        str: Standardized license plate number
    """
    if not plate:
        return None
        
    # Convert to uppercase
    plate = plate.upper()
    
    # Replace spaces with hyphens
    plate = re.sub(r'[\s]', '-', plate)
    
    # If there's no hyphen between letters and numbers, add one
    if '-' not in plate:
        # Find where letters end and numbers begin
        letter_match = re.match(r'^[A-Z]+', plate)
        if letter_match:
            letter_part = letter_match.group(0)
            rest = plate[len(letter_part):]
            
            # Find where numbers end and letters begin again (if applicable)
            number_match = re.match(r'^[0-9]+', rest)
            if number_match:
                number_part = number_match.group(0)
                final_part = rest[len(number_part):]
                
                if final_part:
                    return f"{letter_part}-{number_part}-{final_part}"
                else:
                    return f"{letter_part}-{number_part}"
    
    return plate