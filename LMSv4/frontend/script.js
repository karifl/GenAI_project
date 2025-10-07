// API Configuration
const API_URL = 'http://localhost:5000/api';

// State
let courses = [];
let currentCourseId = null;
let currentLessons = [];

// ==================== PAGE NAVIGATION ====================

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.getElementById(pageId).classList.add('active');
    
    if (pageId === 'courses') {
        loadCourses();
    } else if (pageId === 'home') {
        updateStats();
    }
}

// ==================== COURSE FUNCTIONS ====================

// Load Courses from API
async function loadCourses() {
    const loading = document.getElementById('loading');
    const courseList = document.getElementById('courseList');
    
    loading.classList.add('active');
    
    try {
        const response = await fetch(`${API_URL}/courses`);
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
    const courseList = document.getElementById('courseList');
    
    if (courses.length === 0) {
        courseList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No courses available. Click "Add New Course" to create one!</p>';
        return;
    }
    
    courseList.innerHTML = courses.map(course => `
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
                <button class="btn btn-primary" onclick="viewCourseDetail('${course._id}')">View Lessons</button>
                <button class="btn btn-edit" onclick="editCourse('${course._id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteCourse('${course._id}')">Delete</button>
            </div>
        </div>
    `).join('');
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

// Open Course Modal
function openCourseModal(courseId = null) {
    const modal = document.getElementById('courseModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('courseForm');
    
    form.reset();
    document.getElementById('courseId').value = '';
    
    if (courseId) {
        const course = courses.find(c => c._id === courseId);
        if (course) {
            modalTitle.textContent = 'Edit Course';
            document.getElementById('courseId').value = course._id;
            document.getElementById('courseName').value = course.name;
            document.getElementById('courseDescription').value = course.description;
            document.getElementById('courseInstructor').value = course.instructor;
            document.getElementById('courseDuration').value = course.duration;
            document.getElementById('courseStatus').value = course.status;
        }
    } else {
        modalTitle.textContent = 'Add New Course';
    }
    
    modal.classList.add('active');
}

// Close Course Modal
function closeCourseModal() {
    document.getElementById('courseModal').classList.remove('active');
}

// Edit Course
function editCourse(courseId) {
    openCourseModal(courseId);
}

// Delete Course
async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course? All lessons will be deleted as well.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/courses/${courseId}`, {
            method: 'DELETE'
        });
        
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
        instructor: document.getElementById('courseInstructor').value,
        duration: parseInt(document.getElementById('courseDuration').value),
        status: document.getElementById('courseStatus').value
    };
    
    try {
        let response;
        
        if (courseId) {
            response = await fetch(`${API_URL}/courses/${courseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });
        } else {
            response = await fetch(`${API_URL}/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            closeCourseModal();
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
        const response = await fetch(`${API_URL}/courses/${courseId}`);
        const result = await response.json();
        
        if (result.success) {
            const course = result.data;
            displayCourseDetail(course);
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
    
    const totalDuration = course.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
    
    courseInfo.innerHTML = `
        <h1>${course.name}</h1>
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
                    <button class="btn btn-edit" onclick="event.stopPropagation(); editLesson('${lesson._id}')">Edit</button>
                    <button class="btn btn-danger" onclick="event.stopPropagation(); deleteLesson('${lesson._id}')">Delete</button>
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

// Open Lesson Modal
function openLessonModal(lessonId = null) {
    const modal = document.getElementById('lessonModal');
    const modalTitle = document.getElementById('lessonModalTitle');
    const form = document.getElementById('lessonForm');
    
    form.reset();
    document.getElementById('lessonId').value = '';
    
    if (lessonId) {
        const lesson = currentLessons.find(l => l._id === lessonId);
        if (lesson) {
            modalTitle.textContent = 'Edit Lesson';
            document.getElementById('lessonId').value = lesson._id;
            document.getElementById('lessonTitle').value = lesson.title;
            document.getElementById('lessonDescription').value = lesson.description;
            document.getElementById('lessonContent').value = lesson.content;
            document.getElementById('lessonDuration').value = lesson.duration;
            document.getElementById('lessonVideoUrl').value = lesson.videoUrl || '';
            document.getElementById('lessonIsPublished').checked = lesson.isPublished;
        }
    } else {
        modalTitle.textContent = 'Add New Lesson';
    }
    
    modal.classList.add('active');
}

// Close Lesson Modal
function closeLessonModal() {
    document.getElementById('lessonModal').classList.remove('active');
}

// Edit Lesson
function editLesson(lessonId) {
    openLessonModal(lessonId);
}

// Delete Lesson
async function deleteLesson(lessonId) {
    if (!confirm('Are you sure you want to delete this lesson?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/courses/${currentCourseId}/lessons/${lessonId}`, {
            method: 'DELETE'
        });
        
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

// Lesson Form Submit Handler
document.getElementById('lessonForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const lessonId = document.getElementById('lessonId').value;
    const lessonData = {
        title: document.getElementById('lessonTitle').value,
        description: document.getElementById('lessonDescription').value,
        content: document.getElementById('lessonContent').value,
        duration: parseInt(document.getElementById('lessonDuration').value),
        videoUrl: document.getElementById('lessonVideoUrl').value,
        isPublished: document.getElementById('lessonIsPublished').checked
    };
    
    try {
        let response;
        
        if (lessonId) {
            // Update existing lesson
            response = await fetch(`${API_URL}/courses/${currentCourseId}/lessons/${lessonId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(lessonData)
            });
        } else {
            // Create new lesson
            response = await fetch(`${API_URL}/courses/${currentCourseId}/lessons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(lessonData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            closeLessonModal();
            viewCourseDetail(currentCourseId); // Reload course detail
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error saving lesson:', error);
        alert('Error saving lesson: ' + error.message);
    }
});

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    loadCourses();
    updateStats();
});