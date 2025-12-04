document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. VARIABLES & SETUP
    // ==========================================
    let currentLanguage = 'en'; // Default language English
    let currentSolutionData = null; // To store result data

    // Elements Fetching
    const langBtn = document.getElementById('lang-switcher');
    const navbar = document.querySelector('.desi-nav'); // For Smart Scroll
    
    // Upload Elements
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name');
    const dropArea = document.getElementById('drop-area');
    
    // Result Elements
    const resultSection = document.getElementById('result-section');
    const uploadedImage = document.getElementById('uploaded-image');
    const diseaseName = document.getElementById('disease-name');
    const dataSourceBadge = document.getElementById('data-source');
    
    // Text Content Elements
    const descText = document.getElementById('disease-description');
    const solText = document.getElementById('solution-text');
    const googleBtn = document.getElementById('google-btn');
    const wikiText = document.getElementById('wiki-info');


    // ==========================================
    // 2. SMART NAVBAR (Hide on Scroll Down)
    // ==========================================
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling DOWN -> Hide Navbar
            navbar.style.transform = 'translateY(-100%)';
            navbar.style.transition = 'transform 0.3s ease-in-out';
        } else {
            // Scrolling UP -> Show Navbar
            navbar.style.transform = 'translateY(0)';
        }
        lastScrollTop = scrollTop;
    });


    // ==========================================
    // 3. LANGUAGE SWITCHER LOGIC
    // ==========================================
    
    // Helper Function: Result text ko language ke hisaab se update karo
    function updateResultText() {
        if (!currentSolutionData) return;

        if (currentLanguage === 'en') {
            if(descText) descText.innerText = currentSolutionData.description_en;
            if(solText) solText.innerText = currentSolutionData.solution_en;
        } else {
            if(descText) descText.innerText = currentSolutionData.description_hi;
            if(solText) solText.innerText = currentSolutionData.solution_hi;
        }
    }

    if(langBtn) {
        langBtn.addEventListener('click', function() {
            const enElements = document.querySelectorAll('.lang-en');
            const hiElements = document.querySelectorAll('.lang-hi');
            const btnSpanEn = this.querySelector('.lang-en');
            const btnSpanHi = this.querySelector('.lang-hi');

            if (currentLanguage === 'en') {
                // Switch to Hindi
                enElements.forEach(el => el.classList.add('hidden'));
                hiElements.forEach(el => el.classList.remove('hidden'));
                currentLanguage = 'hi';
                
                // Button text toggle manually if needed (HTML handles most)
                if(btnSpanEn) btnSpanEn.classList.add('hidden');
                if(btnSpanHi) btnSpanHi.classList.remove('hidden');

            } else {
                // Switch to English
                hiElements.forEach(el => el.classList.add('hidden'));
                enElements.forEach(el => el.classList.remove('hidden'));
                currentLanguage = 'en';

                // Button text toggle
                if(btnSpanHi) btnSpanHi.classList.add('hidden');
                if(btnSpanEn) btnSpanEn.classList.remove('hidden');
            }
            
            // Agar result screen par hai, to uska text bhi badlo
            updateResultText();
        });
    }


    // ==========================================
    // 4. DRAG & DROP VISUALS
    // ==========================================
    if (dropArea && fileInput) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            dropArea.style.backgroundColor = '#e8f5e9'; // Light Green
            dropArea.style.borderColor = '#2e7d32'; // Dark Green Border
            dropArea.style.transform = 'scale(1.02)';
        }

        function unhighlight(e) {
            dropArea.style.backgroundColor = 'white';
            dropArea.style.borderColor = '#2e7d32'; // Default Border
            dropArea.style.transform = 'scale(1)';
        }
    }


    // ==========================================
    // 5. IMAGE PREDICTION (MAIN LOGIC)
    // ==========================================
    if(fileInput) {
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            handleFile(file);
        });
    }

    function handleFile(file) {
        if (file) {
            // UI Reset
            fileNameDisplay.textContent = "Selected: " + file.name;
            diseaseName.innerHTML = "Analyzing...";
          //  confidenceScore.textContent = "Please wait, AI is diagnosing...";
            
            if(dataSourceBadge) {
                dataSourceBadge.innerText = "Connecting...";
                dataSourceBadge.className = "text-xs font-bold px-2 py-1 rounded bg-gray-200 text-gray-600";
            }
            
            //CLEARING TEXT AREAS & BUTTONS
            descText.innerText = "Fetching details...";
            solText.innerText = "Fetching remedy...";
            if(googleBtn) googleBtn.classList.add('hidden');
            if(wikiText) wikiText.textContent = "";

            resultSection.classList.remove('hidden');
            
            // Smooth Scroll to Result
            setTimeout(() => {
                 resultSection.scrollIntoView({behavior: "smooth", block: "start"});
            }, 100);

            // Data Prepare
            const formData = new FormData();
            formData.append('file', file);

            // Send to Backend
            fetch('/predict', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if(data.error) {
                    alert("Error: " + data.error);
                    diseaseName.textContent = "Error Occurred";
                } else {
                    // 1. Image
                    uploadedImage.src = data.image_path;

                    // 2. Name (Clean formatting)
                    let cleanName = data.result.replace(/_/g, ' ');
                    diseaseName.textContent = cleanName;
                    //confidenceScore.innerHTML = `Confidence: <span class="text-gray-800">${data.confidence}</span>`;

                    // 3. Data Source Badge Logic
                    if(dataSourceBadge) {
                        dataSourceBadge.innerText = data.source;
                        if(data.source.includes("AI") || data.source.includes("Llama")) {
                            // Online Color
                            dataSourceBadge.className = "text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200";
                        } else {
                            // Offline Color
                            dataSourceBadge.className = "text-xs font-bold px-2 py-1 rounded bg-orange-100 text-orange-800 border border-orange-200";
                        }
                    }

                    // 4. Buttons & Links
                    if(googleBtn) {
                        googleBtn.href = data.search_url;
                        googleBtn.classList.remove('hidden');
                    }
                    
                    // 5. Save Data & Update Text
                    currentSolutionData = data.info;
                    updateResultText();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                diseaseName.textContent = "Server Connection Failed";
                confidenceScore.textContent = "Please make sure python app.py is running.";
            });
        }
    }


    // ==========================================
    // 6. CONTACT FORM HANDLING
    // ==========================================
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Page reload roko

            const submitBtn = contactForm.querySelector('button');
            const originalText = submitBtn.innerText;
            
            // Button styling during sending
            submitBtn.innerText = "Sending...";
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value
            };

            fetch('/contact', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                // Restore Button
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                
                if (data.status === 'success') {
                    alert("✅ Message Sent Successfully!");
                    contactForm.reset();
                } else {
                    alert("❌ Failed: " + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                alert("❌ Server Error. Is Python running?");
            });
        });
    }
});