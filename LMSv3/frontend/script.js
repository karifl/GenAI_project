// API Configuration
const API_URL = 'http://localhost:5000/api';

// State
let courses = [];

// Page Navigation
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

// Load Courses from API (READ)
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
                <p><strong>Enrolled:</strong> ${course.enrolledStudents || 0} students</p>
                <span class="status-badge status-${course.status}">${course.status.toUpperCase()}</span>
            </div>
            <div class="course-actions">
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
            
            document.getElementById('totalCourses').textContent = totalCourses;
            document.getElementById('activeCourses').textContent = activeCourses;
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Open Modal
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

// Close Modal
function closeCourseModal() {
    document.getElementById('courseModal').classList.remove('active');
}

// Create/Update Course (CREATE & UPDATE)
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
            // Update existing course
            response = await fetch(`${API_URL}/courses/${courseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });
        } else {
            // Create new course
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

// Edit Course
function editCourse(courseId) {
    openCourseModal(courseId);
}

// Delete Course (DELETE)
async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course?')) {
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadCourses();
    updateStats();
});