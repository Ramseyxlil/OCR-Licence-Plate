document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadBox = document.getElementById('upload-box');
    const plateImageInput = document.getElementById('plate-image-input');
    const captureButton = document.getElementById('capture-button');
    const cameraContainer = document.getElementById('camera-container');
    const cameraFeed = document.getElementById('camera-feed');
    const takePhotoButton = document.getElementById('take-photo');
    const closeCamera = document.getElementById('close-camera');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const verifyButton = document.getElementById('verify-button');
    const cancelButton = document.getElementById('cancel-button');
    const plateNumberInput = document.getElementById('plate-number-input');
    const searchButton = document.getElementById('search-button');
    const resultsModal = document.getElementById('results-modal');
    const resultsContainer = document.getElementById('results-container');
    const closeModal = document.querySelector('.close');
    const loadingSpinner = document.getElementById('loading-spinner');

    let cameraStream = null;
    let capturedImage = null;

    // Event Listeners
    uploadBox.addEventListener('click', function() {
        plateImageInput.click();
    });

    // Drag and drop functionality
    uploadBox.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = 'var(--primary-dark)';
        this.style.backgroundColor = 'rgba(255, 215, 0, 0.15)';
    });

    uploadBox.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.style.borderColor = 'var(--primary-color)';
        this.style.backgroundColor = 'rgba(255, 215, 0, 0.05)';
    });

    uploadBox.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = 'var(--primary-color)';
        this.style.backgroundColor = 'rgba(255, 215, 0, 0.05)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageFile(files[0]);
        }
    });

    // File input change
    plateImageInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            handleImageFile(this.files[0]);
        }
    });

    // Camera capture
    captureButton.addEventListener('click', startCamera);
    takePhotoButton.addEventListener('click', capturePhoto);
    closeCamera.addEventListener('click', stopCamera);

    // Preview controls
    verifyButton.addEventListener('click', verifyPlate);
    cancelButton.addEventListener('click', resetUpload);

    // Manual search
    searchButton.addEventListener('click', searchPlateNumber);
    plateNumberInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchPlateNumber();
        }
    });

    // Modal close
    closeModal.addEventListener('click', function() {
        resultsModal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === resultsModal) {
            resultsModal.style.display = 'none';
        }
    });

    // Functions
    function handleImageFile(file) {
        if (!file.type.match('image.*')) {
            showAlert('Please select an image file (JPG, JPEG, PNG)', 'danger');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(e) {
            displayPreview(e.target.result);
            capturedImage = file;
        };
        
        reader.readAsDataURL(file);
    }

    function displayPreview(imageSrc) {
        uploadBox.style.display = 'none';
        cameraContainer.style.display = 'none';
        captureButton.style.display = 'none';
        
        imagePreview.src = imageSrc;
        previewContainer.style.display = 'block';
    }

    function resetUpload() {
        uploadBox.style.display = 'flex';
        captureButton.style.display = 'block';
        previewContainer.style.display = 'none';
        plateImageInput.value = '';
        capturedImage = null;
    }

    function startCamera() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function(stream) {
                    cameraStream = stream;
                    cameraFeed.srcObject = stream;
                    
                    uploadBox.style.display = 'none';
                    captureButton.style.display = 'none';
                    cameraContainer.style.display = 'block';
                })
                .catch(function(error) {
                    console.error("Error accessing camera: ", error);
                    showAlert('Could not access the camera. Please check permissions.', 'danger');
                });
        } else {
            showAlert('Your browser does not support camera access', 'danger');
        }
    }

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        
        cameraContainer.style.display = 'none';
        uploadBox.style.display = 'flex';
        captureButton.style.display = 'block';
    }

    function capturePhoto() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = cameraFeed.videoWidth;
        canvas.height = cameraFeed.videoHeight;
        
        // Draw the current video frame to the canvas
        context.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob for file upload
        canvas.toBlob(function(blob) {
            capturedImage = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            displayPreview(canvas.toDataURL('image/jpeg'));
            stopCamera();
        }, 'image/jpeg', 0.95);
    }

    function verifyPlate() {
        if (!capturedImage) {
            showAlert('No image selected', 'warning');
            return;
        }

        showLoading();

        const formData = new FormData();
        formData.append('plate_image', capturedImage);

        fetch('/verify', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            displayResults(data);
        })
        .catch(error => {
            hideLoading();
            console.error('Error:', error);
            showAlert('An error occurred while processing the image', 'danger');
        });
    }

    function searchPlateNumber() {
        const plateNumber = plateNumberInput.value.trim();
        
        if (!plateNumber) {
            showAlert('Please enter a license plate number', 'warning');
            return;
        }

        showLoading();

        fetch(`/api/check/${plateNumber}`)
            .then(response => response.json())
            .then(data => {
                hideLoading();
                displayResults(data);
            })
            .catch(error => {
                hideLoading();
                console.error('Error:', error);
                showAlert('An error occurred while searching for the plate number', 'danger');
            });
    }

    function displayResults(data) {
        if (!data.success) {
            showAlert(data.message || 'No matching plate found', 'warning');
            return;
        }

        // Create HTML for the results
        let resultsHTML = `
            <div class="plate-number">${data.plate_number}</div>
        `;

        // Get the owner and vehicle data
        const owner = data.data.owner || {};
        const vehicle = data.data.vehicle || {};
        const registration = data.data.registration || {};
        const offenses = data.data.offenses || [];
        const notes = data.data.notes || 'No additional notes';

        // Owner Information
        resultsHTML += `
            <div class="result-section">
                <div class="section-title"><i class="fas fa-user"></i> Owner Information</div>
                <div class="data-grid">
                    <div class="data-item">
                        <div class="data-label">Name</div>
                        <div class="data-value">${owner.name || 'N/A'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Age</div>
                        <div class="data-value">${owner.age || 'N/A'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Date of Birth</div>
                        <div class="data-value">${owner.date_of_birth || 'N/A'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Phone</div>
                        <div class="data-value">${owner.phone || 'N/A'}</div>
                    </div>
                    <div class="data-item" style="grid-column: 1 / -1;">
                        <div class="data-label">Address</div>
                        <div class="data-value">${owner.address || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;

        // Vehicle Information
        resultsHTML += `
            <div class="result-section">
                <div class="section-title"><i class="fas fa-car"></i> Vehicle Information</div>
                <div class="data-grid">
                    <div class="data-item">
                        <div class="data-label">Make</div>
                        <div class="data-value">${vehicle.make || 'N/A'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Model</div>
                        <div class="data-value">${vehicle.model || 'N/A'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Year</div>
                        <div class="data-value">${vehicle.year || 'N/A'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Color</div>
                        <div class="data-value">${vehicle.color || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;

        // Registration Information
        const statusClass = registration.status === 'Active' ? 'status-active' : 'status-expired';
        
        resultsHTML += `
            <div class="result-section">
                <div class="section-title"><i class="fas fa-clipboard-check"></i> Registration Information</div>
                <div class="data-grid">
                    <div class="data-item">
                        <div class="data-label">Registration Date</div>
                        <div class="data-value">${registration.date || 'N/A'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Expiration Date</div>
                        <div class="data-value">${registration.expiration || 'N/A'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Status</div>
                        <div class="data-value">
                            <span class="status ${statusClass}">${registration.status || 'Unknown'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Offense Information
        resultsHTML += `
            <div class="result-section">
                <div class="section-title"><i class="fas fa-exclamation-triangle"></i> Traffic Offenses</div>
        `;

        if (offenses.length > 0) {
            resultsHTML += `
                <table class="offenses-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Location</th>
                            <th>Fine</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            offenses.forEach(offense => {
                resultsHTML += `
                    <tr>
                        <td>${offense.date || 'N/A'}</td>
                        <td>${offense.type || 'N/A'}</td>
                        <td>${offense.location || 'N/A'}</td>
                        <td>${offense.fine || 'N/A'}</td>
                    </tr>
                `;
            });

            resultsHTML += `
                    </tbody>
                </table>
            `;
        } else {
            resultsHTML += `<div class="no-offenses">No traffic offenses recorded</div>`;
        }

        resultsHTML += `
            </div>
        `;

        // Notes
        resultsHTML += `
            <div class="result-section">
                <div class="section-title"><i class="fas fa-sticky-note"></i> Additional Notes</div>
                <div class="data-value">${notes}</div>
            </div>
        `;

        // Update the results container and show the modal
        resultsContainer.innerHTML = resultsHTML;
        resultsModal.style.display = 'block';
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        // Insert the alert at the top of the main section
        const mainElement = document.querySelector('main');
        mainElement.insertBefore(alertDiv, mainElement.firstChild);
        
        // Remove the alert after 4 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 4000);
    }

    function showLoading() {
        loadingSpinner.style.display = 'flex';
    }

    function hideLoading() {
        loadingSpinner.style.display = 'none';
    }
});