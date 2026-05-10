import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA36xTQXkIs8ESGyqya7lMso9Winii4qjw",
  authDomain: "tumpukan-7ff65.firebaseapp.com",
  databaseURL: "https://tumpukan-7ff65-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tumpukan-7ff65",
  storageBucket: "tumpukan-7ff65.firebasestorage.app",
  messagingSenderId: "356959332001",
  appId: "1:356959332001:web:3635fb22adcdace26b72e0",
  measurementId: "G-JN8SCG8G5J"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const headerToggle = document.getElementById('header-toggle');
    const mainHeader = document.getElementById('main-header');
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const scrollToRepoBtn = document.getElementById('scroll-to-repo');
    const courseGrid = document.getElementById('course-grid');
    
    // Overlays
    const materialOverlay = document.getElementById('material-overlay');
    const addMaterialOverlay = document.getElementById('add-material-overlay');
    const addCourseOverlay = document.getElementById('add-course-overlay');
    const closeBtns = document.querySelectorAll('.close-overlay');
    
    // Course Details
    const overlayCourseTitle = document.getElementById('overlay-course-title');
    const materialListContainer = document.getElementById('material-list');
    const emptyState = document.getElementById('empty-state');
    const showAddMaterialFormBtn = document.getElementById('show-add-material-form');
    const addMaterialBtn = document.getElementById('add-material-btn');
    
    // Forms
    const addMaterialForm = document.getElementById('add-material-form');
    const addCourseForm = document.getElementById('add-course-form');
    const addCourseBtn = document.getElementById('add-course-btn');
    
    // Toast
    const toast = document.getElementById('notification-toast');
    const toastMessage = document.getElementById('toast-message');

    // === State ===
    let currentCourseId = null;
    let courses = [];

    // === Initialization ===
    initTheme();

    // === Firebase Realtime Database Listener ===
    const coursesRef = ref(db, 'courses');
    onValue(coursesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Convert Firebase object to array of courses
            courses = Object.values(data);
            
            // Ensure materials array exists on each course
            courses.forEach(c => {
                if (!c.materials) c.materials = [];
            });
        } else {
            courses = [];
        }
        
        renderCourses();
        
        // If material overlay is open, re-render it
        if (currentCourseId) {
            const course = courses.find(c => c.id === currentCourseId);
            if (course) {
                renderMaterials(course);
            } else {
                closeAllOverlays();
            }
        }
    });

    // === Header & Theme Logic ===
    function updateHeaderToggleVisibility() {
        const isHeaderVisible = mainHeader.classList.contains('show');
        headerToggle.classList.toggle('hidden', isHeaderVisible);
    }

    headerToggle.addEventListener('click', (event) => {
        mainHeader.classList.toggle('show');
        updateHeaderToggleVisibility();
        event.stopPropagation();
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        mainHeader.classList.remove('show');
        updateHeaderToggleVisibility();
    });

    document.addEventListener('click', (event) => {
        if (mainHeader.classList.contains('show') && !mainHeader.contains(event.target) && !headerToggle.contains(event.target)) {
            mainHeader.classList.remove('show');
            updateHeaderToggleVisibility();
        }
    });

    scrollToRepoBtn.addEventListener('click', () => {
        document.getElementById('repository').scrollIntoView({ behavior: 'smooth' });
    });

    function initTheme() {
        const savedTheme = localStorage.getItem('tumpukan_theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggleBtn.textContent = '☀️ Light Mode';
        } else {
            themeToggleBtn.textContent = '🌙 Dark Mode';
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('tumpukan_theme', 'light');
            themeToggleBtn.textContent = '🌙 Dark Mode';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('tumpukan_theme', 'dark');
            themeToggleBtn.textContent = '☀️ Light Mode';
        }
    });

    // === Core Logic (Firebase) ===
    function renderCourses() {
        courseGrid.innerHTML = '';
        courses.forEach(course => {
            const card = document.createElement('div');
            card.classList.add('course-card');
            card.innerHTML = `
                <h3>${course.name}</h3>
                <button class="course-delete-btn" aria-label="Hapus Mata Kuliah">&times;</button>
            `;

            const deleteBtn = card.querySelector('.course-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteCourse(course.id, course.name);
            });

            card.addEventListener('click', () => openMaterialOverlay(course.id));
            courseGrid.appendChild(card);
        });
    }

    function deleteCourse(courseId, courseName) {
        const confirmed = window.confirm(`Hapus mata kuliah "${courseName}"?`);
        if (!confirmed) return;

        // Delete from Firebase
        const courseRef = ref(db, 'courses/' + courseId);
        remove(courseRef).then(() => {
            showToast('Mata kuliah berhasil dihapus.');
            if (currentCourseId === courseId) {
                closeAllOverlays();
            }
        }).catch(err => {
            alert('Gagal menghapus: ' + err.message);
        });
    }

    function openMaterialOverlay(courseId) {
        currentCourseId = courseId;
        const course = courses.find(c => c.id === courseId);
        if (!course) return;

        overlayCourseTitle.textContent = course.name;
        renderMaterials(course);
        openOverlay(materialOverlay);
    }

    function renderMaterials(course) {
        materialListContainer.innerHTML = '';
        
        if (!course.materials || course.materials.length === 0) {
            materialListContainer.style.display = 'none';
            emptyState.style.display = 'block';
            addMaterialBtn.style.display = 'none';
        } else {
            materialListContainer.style.display = 'flex';
            emptyState.style.display = 'none';
            addMaterialBtn.style.display = 'block';
            
            course.materials.forEach((material, index) => {
                const container = document.createElement('div');
                container.classList.add('material-item-container');
                
                const link = document.createElement('a');
                link.href = material.link;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.classList.add('material-item');
                link.textContent = material.name;
                
                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('material-delete-btn');
                deleteBtn.innerHTML = '&times;';
                deleteBtn.title = 'Hapus Materi';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteMaterial(course.id, index, material.name);
                });
                
                container.appendChild(link);
                container.appendChild(deleteBtn);
                materialListContainer.appendChild(container);
            });
        }
    }

    function deleteMaterial(courseId, materialIndex, materialName) {
        const confirmed = window.confirm(`Hapus materi "${materialName}"?`);
        if (!confirmed) return;

        const course = courses.find(c => c.id === courseId);
        if (course) {
            const materialsList = course.materials ? [...course.materials] : [];
            materialsList.splice(materialIndex, 1);

            const courseMaterialsRef = ref(db, 'courses/' + courseId + '/materials');
            set(courseMaterialsRef, materialsList).then(() => {
                showToast('Materi berhasil dihapus.');
            }).catch(err => {
                alert('Gagal menghapus materi: ' + err.message);
            });
        }
    }

    // === Overlays Handling ===
    function openOverlay(overlay) {
        overlay.classList.add('active');
    }

    function closeAllOverlays() {
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.remove('active');
        });
        currentCourseId = null;
        addMaterialForm.reset();
        addCourseForm.reset();
    }

    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.closest('#add-material-overlay') && currentCourseId) {
                document.getElementById('add-material-overlay').classList.remove('active');
                const course = courses.find(c => c.id === currentCourseId);
                if(course) {
                    renderMaterials(course);
                    openOverlay(materialOverlay);
                } else {
                     closeAllOverlays();
                }
            } else {
                closeAllOverlays();
            }
        });
    });

    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeAllOverlays();
            }
        });
    });

    // === Forms & Interactions ===
    addCourseBtn.addEventListener('click', () => {
        openOverlay(addCourseOverlay);
    });

    showAddMaterialFormBtn.addEventListener('click', () => {
        materialOverlay.classList.remove('active');
        openOverlay(addMaterialOverlay);
    });

    addMaterialBtn.addEventListener('click', () => {
        materialOverlay.classList.remove('active');
        openOverlay(addMaterialOverlay);
    });

    addCourseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const courseNameInput = document.getElementById('course-name');
        const courseName = courseNameInput.value.trim();
        
        if (courseName) {
            const courseId = 'c-' + Date.now();
            const newCourse = {
                id: courseId,
                name: courseName,
                materials: []
            };
            
            // Save to Firebase
            const newCourseRef = ref(db, 'courses/' + courseId);
            set(newCourseRef, newCourse).then(() => {
                addCourseForm.reset();
                addCourseOverlay.classList.remove('active');
                showToast('Mata Kuliah Berhasil Ditambahkan!');
            }).catch(err => {
                alert('Gagal menambah mata kuliah: ' + err.message);
            });
        }
    });

    addMaterialForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('material-name');
        const linkInput = document.getElementById('material-link');
        const name = nameInput.value.trim();
        const link = linkInput.value.trim();
        
        if (name && link && currentCourseId) {
            const course = courses.find(c => c.id === currentCourseId);
            if (course) {
                const materialsList = course.materials ? [...course.materials] : [];
                materialsList.push({ name, link });
                
                // Save materials back to Firebase for this course
                const courseMaterialsRef = ref(db, 'courses/' + currentCourseId + '/materials');
                set(courseMaterialsRef, materialsList).then(() => {
                    addMaterialForm.reset();
                    addMaterialOverlay.classList.remove('active');
                    showToast('Materi Berhasil Ditambahkan!');
                }).catch(err => {
                    alert('Gagal menambahkan materi: ' + err.message);
                });
            }
        }
    });

    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
