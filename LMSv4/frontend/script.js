// API Configuration
const API_URL = 'http://localhost:5000/api';

// State
let courses = [];
let currentCourseId = null;
let currentLessons = [];
let currentUser = null;
let authToken = null;

// ==================== PAGE NAVIGATION ====================

function showPage(pageId) {
    // Hide all pages first
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the requested page
    const targetPage = document.getElementById(pageId);
    
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Load data if needed
            if (pageId === 'courses') {
                loadCourses();
            } else if (pageId === 'home') {
                updateStats();
            }
        } else {
            showPage('login');
            document.getElementById('loginForm').reset();
            return;
        }
    }   



// ==================== AUTHENTICATION FUNCTIONS ====================

// Check if user is logged in
function checkAuthStatus() {
    const user = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');
    
    if (user && token) {
        currentUser = JSON.parse(user);
        authToken = token;
        updateNavigation(true);
        return true;
    } else {
        updateNavigation(false);
        return false;
    }
}

// Update navigation based on auth status
function updateNavigation(isLoggedIn) {
    const authLinks = document.getElementById('authLinks');
    const userLinks = document.getElementById('userLinks');
    const userName = document.getElementById('userName');
    const addCourseBtn = document.getElementById('addCourseBtn');
    const addLessonBtn = document.getElementById('addLessonBtn');
    
    console.log('Updating navigation, isLoggedIn:', isLoggedIn);
    console.log('currentUser:', currentUser);
    
    if (isLoggedIn && currentUser) {
        authLinks.style.display = 'none';
        userLinks.style.display = 'flex';
        userName.textContent = `Welcome, ${currentUser.fullName || 'User'} (${currentUser.role})`;
        
        // Show/hide role-based elements
        if (addCourseBtn) {
            addCourseBtn.style.display = (currentUser.role === 'instructor' || currentUser.role === 'admin') ? 'block' : 'none';
        }
        if (addLessonBtn) {
            addLessonBtn.style.display = (currentUser.role === 'instructor' || currentUser.role === 'admin') ? 'block' : 'none';
        }
        
        console.log('Showing user links for:', currentUser.fullName);
    } else {
        authLinks.style.display = 'flex';
        userLinks.style.display = 'none';
        console.log('Showing auth links');
    }
}

// Register User
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Registration successful! Please login with your credentials.');
            showPage('login');
            document.getElementById('registerForm').reset();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error registering user:', error);
        alert('Registration failed: ' + error.message);
    }
}

// Login User
async function loginUser(email, password) {
    try {
        console.log('Attempting login with:', { email, API_URL });
        
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Login result:', result);
        
        if (result.success) {
            currentUser = result.data.user;
            authToken = result.data.token;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('authToken', authToken);
            updateNavigation(true);
            alert('Login successful! Welcome back.');
            showPage('home');
            document.getElementById('loginForm').reset();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Login failed: ' + error.message);
    }
}

// Logout User
function logout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    updateNavigation(false);
    alert('Logged out successfully.');
    showPage('login');
}

// ==================== API HELPER FUNCTIONS ====================

// Make authenticated API call
async function apiCall(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    const response = await fetch(url, mergedOptions);
    
    // If unauthorized, redirect to login
    if (response.status === 401) {
        logout();
        alert('Session expired. Please login again.');
        return null;
    }
    
    return response;
}

// ==================== COURSE FUNCTIONS ====================

// Enroll in Course (Students only)
async function enrollInCourse(courseId) {
    if (!currentUser || currentUser.role !== 'student') {
        alert('Only students can enroll in courses.');
        return;
    }
    
    try {
        const response = await apiCall(`${API_URL}/users/${currentUser._id}/enroll/${courseId}`, {
            method: 'POST'
        });
        
        if (!response) return;
        const result = await response.json();
        
        if (result.success) {
            alert('Successfully enrolled in course!');
            loadCourses(); // Refresh course list
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error enrolling in course:', error);
        alert('Error enrolling in course: ' + error.message);
    }
}

// Load Courses from API
async function loadCourses() {
    const loading = document.getElementById('loading');
    const courseList = document.getElementById('courseList');
    
    loading.classList.add('active');
    
    try {
        const response = await apiCall(`${API_URL}/courses`);
        if (!response) return;
        const result = await response.json();
        
        if (result.success) {
            courses = result.data;
            displayCourses();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        courseList.innerHTML = `<div class="error-message">Error loading courses: ${error.message}</div>`;
    } finally {
        loading.classList.remove('active');
    }
}

// Display Courses
function displayCourses() {
    if ((!currentUser || currentUser.role !== 'student') && (!currentUser || currentUser.role !== 'instructor') && (!currentUser || currentUser.role !== 'admin')) {
        alert('You are not authorized to view courses. Please login as a student, instructor, or admin.');
        showPage('login');
        document.getElementById('loginForm').reset();
        return;
    }
    const courseList = document.getElementById('courseList');
    
    if (courses.length === 0) {
        courseList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No courses available. Click "Add New Course" to create one!</p>';
        return;
    }
    
    courseList.innerHTML = courses.map(course => {
        const isInstructor = currentUser && (currentUser.role === 'instructor' || currentUser.role === 'admin');
        const isCourseOwner = isInstructor && course.instructorId === currentUser._id;
        const isStudent = currentUser && currentUser.role === 'student';
        const isEnrolled = isStudent && currentUser.enrolledCourses?.some(enrollment => enrollment.courseId === course._id);
        
        return `
        <div class="course-card">
            <h3>${course.name}</h3>
            <p>${course.description}</p>
            <div class="course-info">
                <p><strong>Instructor:</strong> ${course.instructor}</p>
                <p><strong>Duration:</strong> ${course.duration} weeks</p>
                <p><strong>Lessons:</strong> ${course.lessons?.length || 0}</p>
                <p><strong>Enrolled:</strong> ${course.enrolledStudents || 0} students</p>
                <span class="status-badge status-${course.status}">${course.status.toUpperCase()}</span>
            </div>
            <div class="course-actions">
                ${isStudent && !isEnrolled ? 
                    `<button class="btn btn-primary" onclick="enrollInCourse('${course._id}')">Enroll</button>` :
                    `<button class="btn btn-primary" onclick="viewCourseDetail('${course._id}')">View Lessons</button>`
                }
                ${isCourseOwner ? `
                    <button class="btn btn-edit" onclick="editCourse('${course._id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteCourse('${course._id}')">Delete</button>
                ` : ''}
            </div>
        </div>
    `;
    }).join('');
}

// Update Statistics
async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/courses`);
        const result = await response.json();
        
        if (result.success) {
            const totalCourses = result.data.length;
            const activeCourses = result.data.filter(c => c.status === 'active').length;
            const totalLessons = result.data.reduce((sum, course) => sum + (course.lessons?.length || 0), 0);
            
            document.getElementById('totalCourses').textContent = totalCourses;
            document.getElementById('activeCourses').textContent = activeCourses;
            document.getElementById('totalLessons').textContent = totalLessons;
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Open Course Page
function openCoursePage(courseId = null) {
    const form = document.getElementById('courseForm');
    const pageTitle = document.getElementById('addCourseTitle');
    const instructorField = document.getElementById('courseInstructor');
    
    form.reset();
    document.getElementById('courseId').value = '';
    
    // Always set instructor name from current user
    if (currentUser) {
        const instructorName = currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`;
        instructorField.value = instructorName;
        instructorField.readOnly = true;
        instructorField.style.backgroundColor = '#f5f5f5';
    }
    
    if (courseId) {
        const course = courses.find(c => c._id === courseId);
        if (course) {
            pageTitle.textContent = 'Edit Course';
            document.getElementById('courseId').value = course._id;
            document.getElementById('courseName').value = course.name;
            document.getElementById('courseDescription').value = course.description;
            document.getElementById('courseDuration').value = course.duration;
            document.getElementById('courseStatus').value = course.status;
        }
    } else {
        pageTitle.textContent = 'Add New Course';
    }
    
    showPage('addCourse');
}

// Edit Course
function editCourse(courseId) {
    openCoursePage(courseId);
}

// Reset Course Form
function resetCourseForm() {
    const form = document.getElementById('courseForm');
    const instructorField = document.getElementById('courseInstructor');
    
    form.reset();
    document.getElementById('courseId').value = '';
    
    // Re-populate instructor field
    if (currentUser) {
        const instructorName = currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`;
        instructorField.value = instructorName;
    }
    
    // Focus on the first field
    document.getElementById('courseName').focus();
}

// Delete Course
async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course? All lessons will be deleted as well.')) {
        return;
    }
    
    try {
        const response = await apiCall(`${API_URL}/courses/${courseId}`, {
            method: 'DELETE'
        });
        
        if (!response) return;
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            loadCourses();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course: ' + error.message);
    }
}

// Course Form Submit Handler
document.getElementById('courseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const courseId = document.getElementById('courseId').value;
    const courseData = {
        name: document.getElementById('courseName').value,
        description: document.getElementById('courseDescription').value,
        duration: parseInt(document.getElementById('courseDuration').value),
        status: document.getElementById('courseStatus').value
        // instructor field is automatically set by backend from logged-in user
    };
    
    try {
        let response;
        
        if (courseId) {
            response = await apiCall(`${API_URL}/courses/${courseId}`, {
                method: 'PUT',
                body: JSON.stringify(courseData)
            });
        } else {
            response = await apiCall(`${API_URL}/courses`, {
                method: 'POST',
                body: JSON.stringify(courseData)
            });
        }
        
        if (!response) return;
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            // Reset the form
            document.getElementById('courseForm').reset();
            // Re-populate instructor field for future use
            if (currentUser) {
                const instructorName = currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`;
                document.getElementById('courseInstructor').value = instructorName;
            }
            showPage('courses');
            loadCourses();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error saving course:', error);
        alert('Error saving course: ' + error.message);
    }
});

// ==================== LESSON FUNCTIONS ====================

// View Course Detail with Lessons
async function viewCourseDetail(courseId) {
    currentCourseId = courseId;
    
    try {
        const response = await apiCall(`${API_URL}/courses/${courseId}`);
        if (!response) return;
        const result = await response.json();
        
        if (result.success) {
            const course = result.data;
            displayCourseDetail(course);
            // Show course detail section
            showPage('courseDetail');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading course detail:', error);
        alert('Error loading course: ' + error.message);
    }
}

// Display Course Detail
function displayCourseDetail(course) {
    const courseInfo = document.getElementById('courseInfo');
    const courseDetailTitle = document.getElementById('courseDetailTitle');
    
    // Update the page header title
    courseDetailTitle.textContent = course.name;
    
    const totalDuration = course.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
    
    courseInfo.innerHTML = `
        <p>${course.description}</p>
        <div class="course-meta">
            <div class="course-meta-item">
                <label>Instructor</label>
                <span>${course.instructor}</span>
            </div>
            <div class="course-meta-item">
                <label>Duration</label>
                <span>${course.duration} weeks</span>
            </div>
            <div class="course-meta-item">
                <label>Total Lessons</label>
                <span>${course.lessons.length}</span>
            </div>
            <div class="course-meta-item">
                <label>Total Lesson Time</label>
                <span>${totalDuration} minutes</span>
            </div>
            <div class="course-meta-item">
                <label>Status</label>
                <span class="status-badge status-${course.status}">${course.status.toUpperCase()}</span>
            </div>
        </div>
    `;
    
    currentLessons = course.lessons;
    displayLessons();
}

// Display Lessons
function displayLessons() {
    const lessonList = document.getElementById('lessonList');
    
    if (currentLessons.length === 0) {
        lessonList.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No lessons yet. Click "Add Lesson" to create one!</p>';
        return;
    }
    
    const isInstructor = currentUser && (currentUser.role === 'instructor' || currentUser.role === 'admin');
    
    lessonList.innerHTML = currentLessons.map((lesson, index) => `
        <div class="lesson-item">
            <div class="lesson-header" onclick="toggleLesson('${lesson._id}')">
                <div class="lesson-title-section">
                    <h3>Lesson ${index + 1}: ${lesson.title}</h3>
                    <div class="lesson-meta">
                        <span>⏱️ ${lesson.duration} minutes</span>
                        <span>${lesson.isPublished ? '✅ Published' : '📝 Draft'}</span>
                    </div>
                </div>
                <div class="lesson-actions-header">
                    ${isInstructor ? `
                        <button class="btn btn-edit" onclick="event.stopPropagation(); editLessonForm('${lesson._id}')">Edit</button>
                        <button class="btn btn-danger" onclick="event.stopPropagation(); deleteLesson('${lesson._id}')">Delete</button>
                    ` : ''}
                    <span class="expand-icon" id="icon-${lesson._id}">▼</span>
                </div>
            </div>
            <div class="lesson-body" id="body-${lesson._id}">
                <div class="lesson-description">
                    <strong>Description:</strong>
                    <p>${lesson.description}</p>
                </div>
                <div class="lesson-content">
                    <strong>Content:</strong>
                    <div>${lesson.content}</div>
                </div>
                ${lesson.videoUrl ? `
                    <div class="lesson-video">
                        <strong>Video:</strong>
                        <a href="${lesson.videoUrl}" target="_blank">${lesson.videoUrl}</a>
                    </div>
                ` : ''}
                ${lesson.downloadableMaterials && lesson.downloadableMaterials.length > 0 ? `
                    <div class="lesson-materials">
                        <strong>Downloadable Materials:</strong>
                        <ul>
                            ${lesson.downloadableMaterials.map(material => `
                                <li>
                                    <a href="${material.cloudinaryUrl || `${API_URL}/courses/${currentCourseId}/lessons/${lesson._id}/materials/${material._id}/download`}" target="_blank">
                                        📄 ${material.name}
                                    </a>
                                    (${(material.fileSize / 1024).toFixed(1)} KB)
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Toggle Lesson Expand/Collapse
function toggleLesson(lessonId) {
    const body = document.getElementById(`body-${lessonId}`);
    const icon = document.getElementById(`icon-${lessonId}`);
    
    body.classList.toggle('expanded');
    icon.classList.toggle('rotated');
}

// Open Add Lesson Page
function openAddLessonPage() {
    const form = document.getElementById('addLessonForm');
    form.reset();
    showPage('addNewLesson');
}

// Open Edit Lesson Page
function openEditLessonPage(lessonId) {
    const lesson = currentLessons.find(l => l._id === lessonId);
    if (lesson) {
        document.getElementById('editLessonId').value = lesson._id;
        document.getElementById('editLessonTitle').value = lesson.title;
        document.getElementById('editLessonDescription').value = lesson.description;
        document.getElementById('editLessonContent').value = lesson.content;
        document.getElementById('editLessonDuration').value = lesson.duration;
        document.getElementById('editLessonVideoUrl').value = lesson.videoUrl || '';
        document.getElementById('editLessonIsPublished').checked = lesson.isPublished;
        showPage('editLesson');
    }
}

// Go back to course detail page
function goBackToCourseDetail() {
    showPage('courseDetail');
}

// Reset Lesson Form
function resetLessonForm() {
    const form = document.getElementById('addLessonForm');
    form.reset();
    
    // Focus on the first field
    document.getElementById('addLessonTitle').focus();
}

// Open Edit Lesson Form
function editLessonForm(lessonId) {
    openEditLessonPage(lessonId);
}

// Delete Lesson
async function deleteLesson(lessonId) {
    if (!confirm('Are you sure you want to delete this lesson?')) {
        return;
    }
    
    try {
        const response = await apiCall(`${API_URL}/courses/${currentCourseId}/lessons/${lessonId}`, {
            method: 'DELETE'
        });
        
        if (!response) return;
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            viewCourseDetail(currentCourseId); // Reload course detail
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error deleting lesson:', error);
        alert('Error deleting lesson: ' + error.message);
    }
}

// Add New Lesson
async function addLesson(lessonData) {
    try {
        console.log('Adding lesson with data:', lessonData);
        console.log('Current course ID:', currentCourseId);
        
        const fileInput = document.getElementById('addLessonFile');
        const formData = new FormData();
        
        // Add lesson data
        Object.keys(lessonData).forEach(key => {
            formData.append(key, lessonData[key]);
        });
        
        // Add file if selected
        if (fileInput.files[0]) {
            console.log('File selected:', fileInput.files[0].name);
            formData.append('file', fileInput.files[0]);
        }
        
        console.log('Sending request to:', `${API_URL}/courses/${currentCourseId}/lessons`);
        console.log('FormData contents:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
            if((pair[0] === 'file') && (fileInput.files[0])) {
                console.log('File name:', fileInput.files[0].name);
                console.log('File size:', fileInput.files[0].size);
            }
        }
        
        const response = await fetch(`${API_URL}/courses/${currentCourseId}/lessons`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
                // Note: Don't set Content-Type for FormData - browser sets it automatically with boundary
            },
            body: formData
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                logout();
                alert('Session expired. Please login again.');
                return;
            }
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Lesson creation result:', result);
        
        if (result.success) {
            alert(result.message);
            // Reset the form
            document.getElementById('addLessonForm').reset();
            goBackToCourseDetail();
            viewCourseDetail(currentCourseId); // Reload course detail
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error adding lesson:', error);
        alert('Error adding lesson: ' + error.message);
    }
}

// Edit Existing Lesson
async function editLesson(lessonId, lessonData) {
    try {
        const response = await apiCall(`${API_URL}/courses/${currentCourseId}/lessons/${lessonId}`, {
            method: 'PUT',
            body: JSON.stringify(lessonData)
        });
        
        if (!response) return;
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            // Reset the form
            document.getElementById('editLessonForm').reset();
            goBackToCourseDetail();
            viewCourseDetail(currentCourseId); // Reload course detail
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error editing lesson:', error);
        alert('Error editing lesson: ' + error.message);
    }
}

// Add Lesson Form Submit Handler
document.getElementById('addLessonForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const lessonData = {
        title: document.getElementById('addLessonTitle').value,
        description: document.getElementById('addLessonDescription').value,
        content: document.getElementById('addLessonContent').value,
        duration: parseInt(document.getElementById('addLessonDuration').value),
        videoUrl: document.getElementById('addLessonVideoUrl').value,
        isPublished: document.getElementById('addLessonIsPublished').checked
    };
    
    await addLesson(lessonData);
});

// Edit Lesson Form Submit Handler
document.getElementById('editLessonForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const lessonId = document.getElementById('editLessonId').value;
    const lessonData = {
        title: document.getElementById('editLessonTitle').value,
        description: document.getElementById('editLessonDescription').value,
        content: document.getElementById('editLessonContent').value,
        duration: parseInt(document.getElementById('editLessonDuration').value),
        videoUrl: document.getElementById('editLessonVideoUrl').value,
        isPublished: document.getElementById('editLessonIsPublished').checked
    };
    
    await editLesson(lessonId, lessonData);
});

// ==================== NAVIGATION ====================
// Scroll-based navigation removed for accessibility

// ==================== AUTHENTICATION FORM HANDLERS ====================

// Login Form Submit Handler
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    await loginUser(email, password);
});

// Registration Form Submit Handler
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const userData = {
        firstName: document.getElementById('regFirstName').value,
        lastName: document.getElementById('regLastName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        role: document.getElementById('regRole').value
    };
    
    await registerUser(userData);
});

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status first
    const isAuthenticated = checkAuthStatus();
    
    // Show appropriate page based on authentication status
    if (isAuthenticated) {
        showPage('home');
        loadCourses();
        updateStats();
    } else {
        showPage('login');
    }
});