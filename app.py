from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
import os
import uuid
from werkzeug.utils import secure_filename
from utils.azure_ocr import extract_license_plate
from utils.db_handler import search_plate_in_database

app = Flask(__name__)
app.secret_key = 'license_plate_verifier'

# Configure upload folder
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/verify', methods=['POST'])
def verify_plate():
    # Check if image was uploaded
    if 'plate_image' not in request.files:
        flash('No file selected')
        return redirect(url_for('index'))
    
    file = request.files['plate_image']
    
    # If user does not select file
    if file.filename == '':
        flash('No file selected')
        return redirect(url_for('index'))
    
    if file and allowed_file(file.filename):
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Save the uploaded file
        file.save(file_path)
        
        try:
            # Process image with Azure Document Intelligence
            plate_number = extract_license_plate(file_path)
            print("Extracted license plate number:", plate_number)
            
            if not plate_number:
                return jsonify({
                    'success': False,
                    'message': 'Could not detect license plate number in the image'
                })
            
            # Search for plate in database
            plate_data = search_plate_in_database(plate_number)
            
            if plate_data:
                return jsonify({
                    'success': True,
                    'plate_number': plate_number,
                    'data': plate_data,
                    'image_path': file_path
                })
            else:
                return jsonify({
                    'success': False,
                    'plate_number': plate_number,
                    'message': 'License plate not found in database'
                })
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error processing image: {str(e)}'
            })
    else:
        flash('Invalid file type. Please upload JPG, JPEG or PNG files.')
        return redirect(url_for('index'))

@app.route('/api/check/<plate_number>', methods=['GET'])
def api_check_plate(plate_number):
    """API endpoint to check a plate number directly"""
    plate_data = search_plate_in_database(plate_number)
    
    if plate_data:
        return jsonify({
            'success': True,
            'plate_number': plate_number,
            'data': plate_data
        })
    else:
        return jsonify({
            'success': False,
            'plate_number': plate_number,
            'message': 'License plate not found in database'
        })

if __name__ == '__main__':
    app.run(debug=True)