// Data Storage (using localStorage)
let courses = JSON.parse(localStorage.getItem('courses')) || [];

// Page Navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Refresh course list if courses page is shown
    if (pageId === 'courses') {
        displayCourses();
    }
}

// Display Courses (READ)
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
            </div>
            <div class="course-actions">
                <button class="btn btn-edit" onclick="editCourse(${course.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteCourse(${course.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Open Modal for Create/Update
function openCourseModal(courseId = null) {
    const modal = document.getElementById('courseModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('courseForm');
    
    // Reset form
    form.reset();
    document.getElementById('courseId').value = '';
    
    if (courseId) {
        // Edit mode
        const course = courses.find(c => c.id === courseId);
        if (course) {
            modalTitle.textContent = 'Edit Course';
            document.getElementById('courseId').value = course.id;
            document.getElementById('courseName').value = course.name;
            document.getElementById('courseDescription').value = course.description;
            document.getElementById('courseInstructor').value = course.instructor;
            document.getElementById('courseDuration').value = course.duration;
        }
    } else {
        // Create mode
        modalTitle.textContent = 'Add New Course';
    }
    
    modal.classList.add('active');
}

// Close Modal
function closeCourseModal() {
    const modal = document.getElementById('courseModal');
    modal.classList.remove('active');
}

// Create/Update Course (CREATE & UPDATE)
document.getElementById('courseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const courseId = document.getElementById('courseId').value;
    const courseData = {
        name: document.getElementById('courseName').value,
        description: document.getElementById('courseDescription').value,
        instructor: document.getElementById('courseInstructor').value,
        duration: parseInt(document.getElementById('courseDuration').value)
    };
    
    if (courseId) {
        // Update existing course
        const index = courses.findIndex(c => c.id === parseInt(courseId));
        courses[index] = { ...courses[index], ...courseData };
        alert('Course updated successfully!');
    } else {
        // Create new course
        const newCourse = {
            id: Date.now(),
            ...courseData
        };
        courses.push(newCourse);
        alert('Course created successfully!');
    }
    
    // Save to localStorage
    localStorage.setItem('courses', JSON.stringify(courses));
    
    // Close modal and refresh list
    closeCourseModal();
    displayCourses();
});

// Edit Course
function editCourse(courseId) {
    openCourseModal(courseId);
}

// Delete Course (DELETE)
function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course?')) {
        courses = courses.filter(c => c.id !== courseId);
        localStorage.setItem('courses', JSON.stringify(courses));
        displayCourses();
        alert('Course deleted successfully!');
    }
}

// Initialize - Display courses on load
displayCourses();