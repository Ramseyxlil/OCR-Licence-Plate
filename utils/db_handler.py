import json
import os
from config import DATABASE_PATH

def load_database():
    """
    Load the license plate database from the JSON file
    
    Returns:
        dict: The database as a dictionary
    """
    # Create database directory if it doesn't exist
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    # Check if database file exists, create with dummy data if not
    if not os.path.exists(DATABASE_PATH):
        create_dummy_database()
    
    try:
        with open(DATABASE_PATH, 'r') as file:
            database = json.load(file)
        return database
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"Error loading database: {e}")
        # Return empty database if there's an error
        return {"plates": []}

def search_plate_in_database(plate_number):
    """
    Search for a license plate in the database
    
    Args:
        plate_number (str): The license plate number to search for
        
    Returns:
        dict: Vehicle and owner information if found, None otherwise
    """
    database = load_database()
    
    # Standardize the plate number format for comparison
    standardized_plate = standardize_plate_format(plate_number)
    
    for plate_entry in database.get("plates", []):
        db_plate = standardize_plate_format(plate_entry.get("plate_number", ""))
        
        if db_plate == standardized_plate:
            return plate_entry
    
    return None

def standardize_plate_format(plate_number):
    """
    Standardize license plate format for consistent comparison
    
    Args:
        plate_number (str): The license plate number
        
    Returns:
        str: Standardized plate number
    """
    if not plate_number:
        return ""
    
    # Convert to uppercase
    plate = plate_number.upper()
    
    # Remove all spaces and hyphens
    plate = plate.replace(" ", "").replace("-", "")
    
    return plate

def create_dummy_database():
    """Create a dummy database with sample Nigerian license plates"""
    dummy_data = {
        "plates": [
            {
                "plate_number": "ABC-123XY",
                "owner": {
                    "name": "John Adebayo",
                    "date_of_birth": "1985-05-12",
                    "age": 40,
                    "address": "15 Marina Street, Lagos",
                    "phone": "080-1234-5678"
                },
                "vehicle": {
                    "make": "Toyota",
                    "model": "Camry",
                    "year": 2019,
                    "color": "Black"
                },
                "registration": {
                    "date": "2020-01-15",
                    "expiration": "2025-01-14",
                    "status": "Active"
                },
                "offenses": [
                    {
                        "date": "2023-07-22",
                        "type": "Speeding",
                        "location": "Lekki Expressway, Lagos",
                        "fine": "₦25,000"
                    }
                ],
                "notes": "Vehicle inspection due in 3 months"
            },
            {
                "plate_number": "LAG-572AA",
                "owner": {
                    "name": "Amina Ibrahim",
                    "date_of_birth": "1990-11-28",
                    "age": 35,
                    "address": "7B Adeola Odeku Street, Victoria Island, Lagos",
                    "phone": "081-5555-7890"
                },
                "vehicle": {
                    "make": "Honda",
                    "model": "Accord",
                    "year": 2021,
                    "color": "Silver"
                },
                "registration": {
                    "date": "2021-03-17",
                    "expiration": "2026-03-16",
                    "status": "Active"
                },
                "offenses": [],
                "notes": "No violations recorded"
            },
            {
                "plate_number": "KJA-419DE",
                "owner": {
                    "name": "Oluwaseun Oladipo",
                    "date_of_birth": "1978-09-05",
                    "age": 47,
                    "address": "24 Challenge Road, Ibadan",
                    "phone": "070-4321-9876"
                },
                "vehicle": {
                    "make": "Lexus",
                    "model": "RX350",
                    "year": 2018,
                    "color": "White"
                },
                "registration": {
                    "date": "2018-12-10",
                    "expiration": "2023-12-09",
                    "status": "Expired"
                },
                "offenses": [
                    {
                        "date": "2022-05-11",
                        "type": "Illegal Parking",
                        "location": "Ring Road, Ibadan",
                        "fine": "₦10,000"
                    },
                    {
                        "date": "2023-02-03",
                        "type": "Driving Without Seatbelt",
                        "location": "Dugbe Road, Ibadan",
                        "fine": "₦5,000"
                    }
                ],
                "notes": "Registration renewal pending"
            },
            {
                "plate_number": "FCT-703GH",
                "owner": {
                    "name": "Chinedu Okonkwo",
                    "date_of_birth": "1982-03-17",
                    "age": 43,
                    "address": "Plot 45, Wuse Zone 5, Abuja",
                    "phone": "090-8765-4321"
                },
                "vehicle": {
                    "make": "Nissan",
                    "model": "Pathfinder",
                    "year": 2020,
                    "color": "Blue"
                },
                "registration": {
                    "date": "2020-08-22",
                    "expiration": "2025-08-21",
                    "status": "Active"
                },
                "offenses": [
                    {
                        "date": "2024-01-30",
                        "type": "Running Red Light",
                        "location": "Banex Junction, Abuja",
                        "fine": "₦15,000"
                    }
                ],
                "notes": "Vehicle in good standing"
            },
            {
                "plate_number": "KWR-251ZA",
                "owner": {
                    "name": "Fatima Suleiman",
                    "date_of_birth": "1995-07-30",
                    "age": 30,
                    "address": "10 Unity Road, Ilorin",
                    "phone": "081-2345-6789"
                },
                "vehicle": {
                    "make": "Hyundai",
                    "model": "Tucson",
                    "year": 2022,
                    "color": "Red"
                },
                "registration": {
                    "date": "2022-05-15",
                    "expiration": "2027-05-14",
                    "status": "Active"
                },
                "offenses": [],
                "notes": "New registration"
            }
        ]
    }
    
    # Create the directory if it doesn't exist
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    # Write the dummy data to the database file
    with open(DATABASE_PATH, 'w') as file:
        json.dump(dummy_data, file, indent=4)
    
    print(f"Created dummy database at {DATABASE_PATH}")