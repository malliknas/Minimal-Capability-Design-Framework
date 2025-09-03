// Thesis Website JavaScript Functionality
class ThesisWebsite {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMobileMenu();
        this.setupNavigation();
        this.updateActiveSection();
    }

    setupEventListeners() {
        // Navigation item clicks
        document.querySelectorAll('.nav-item, .nav-subitem').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigationClick(item);
            });
        });

        // Expandable navigation items
        document.querySelectorAll('.nav-item.expandable').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleNavSection(item);
            });
        });

        // Smooth scrolling for internal links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    this.smoothScrollTo(target);
                }
            }
        });

        // Update active section on scroll
        window.addEventListener('scroll', () => {
            this.updateActiveSection();
        });
    }

    setupMobileMenu() {
        const mobileToggle = document.getElementById('mobile-toggle');
        const sidebar = document.getElementById('sidebar');

        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            });
        }
    }

    setupNavigation() {
        // Initialize navigation state
        this.updateBreadcrumb();
        this.highlightCurrentChapter();
    }

    handleNavigationClick(item) {
        const target = item.getAttribute('data-target');
        
        // Remove active class from all items
        document.querySelectorAll('.nav-item, .nav-subitem').forEach(navItem => {
            navItem.classList.remove('active');
        });

        // Add active class to clicked item
        item.classList.add('active');

        // Update content based on target
        this.loadChapterContent(target);
        
        // Update breadcrumb
        this.updateBreadcrumb(item);

        // Close mobile menu if open
        document.getElementById('sidebar')?.classList.remove('open');
    }

    toggleNavSection(item) {
        const subsections = item.nextElementSibling;
        const expandIcon = item.querySelector('.expand-icon');
        
        if (subsections && subsections.classList.contains('nav-subsections')) {
            subsections.classList.toggle('expanded');
            item.classList.toggle('expanded');
            
            if (expandIcon) {
                expandIcon.textContent = subsections.classList.contains('expanded') ? '▼' : '▶';
            }
        }
    }

    loadChapterContent(target) {
        const contentArea = document.getElementById('chapter-content');
        
        // This is where you would load different chapter content
        // For now, we'll show a placeholder
        const placeholderContent = this.getPlaceholderContent(target);
        
        if (contentArea) {
            contentArea.innerHTML = placeholderContent;
        }

        // Scroll to top of content
        contentArea?.scrollIntoView({ behavior: 'smooth' });
    }

    getPlaceholderContent(target) {
        const contentMap = {
            'abstract': {
                title: 'Abstract',
                content: 'This section will contain your thesis abstract converted from Word to HTML.'
            },
            'chapter1': {
                title: 'Chapter 1: Introduction',
                content: 'This section will contain Chapter 1 content converted from Word to HTML.'
            },
            'chapter7': {
                title: 'Chapter 7: Comprehensive Walkthrough Analysis',
                content: 'This section will contain Chapter 7 content converted from Word to HTML. You can paste the converted HTML from wordtohtml.net here.'
            },
            'references': {
                title: 'References',
                content: 'This section will contain your bibliography and references.'
            },
            'appendices': {
                title: 'Appendices',
                content: 'This section will contain supplementary materials and appendices.'
            }
        };

        const content = contentMap[target] || {
            title: 'Chapter Content',
            content: 'Content for this section will be loaded here.'
        };

        return `
            <div class="content-placeholder">
                <h2>${content.title}</h2>
                <p>${content.content}</p>
                <div style="margin-top: 2rem; padding: 1rem; background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px;">
                    <strong>Instructions:</strong> Replace this placeholder with the HTML content converted from your Word document using wordtohtml.net.
                </div>
            </div>
        `;
    }

    updateBreadcrumb(activeItem) {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (!breadcrumb || !activeItem) return;

        const text = activeItem.querySelector('.nav-text')?.textContent || 'Current Section';
        
        breadcrumb.innerHTML = `
            <span class="breadcrumb-item">Home</span>
            <span class="breadcrumb-separator">></span>
            <span class="breadcrumb-item current">${text}</span>
        `;
    }

    highlightCurrentChapter() {
        // Add any chapter highlighting logic here
        const currentChapter = document.querySelector('.nav-item.active');
        if (currentChapter) {
            currentChapter.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    updateActiveSection() {
        // Update progress and active sections based on scroll position
        // This is a simplified version - you can expand this based on your needs
        const scrollPercent = Math.min(100, (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        const progressFill = document.querySelector('.progress-fill');
        
        if (progressFill) {
            progressFill.style.width = `${scrollPercent}%`;
        }
    }

    smoothScrollTo(target) {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // Utility method to update progress
    updateProgress(percentage) {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressFill && progressText) {
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${percentage}% Complete`;
        }
    }

    // Method to mark chapters as completed
    markChapterCompleted(chapterTarget) {
        const navItem = document.querySelector(`[data-target="${chapterTarget}"]`);
        const status = navItem?.querySelector('.status');
        
        if (status) {
            status.className = 'status completed';
            status.textContent = '✓';
        }
    }
}

// Initialize the website when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const website = new ThesisWebsite();
    
    // Make website instance globally available for testing/debugging
    window.thesisWebsite = website;
});

// Additional utility functions for chapter management
function addNewChapter(chapterNumber, chapterTitle, subsections = []) {
    const navMenu = document.querySelector('.nav-menu');
    
    const chapterHTML = `
        <div class="nav-section">
            <div class="nav-item expandable" data-target="chapter${chapterNumber}">
                <span class="nav-icon">📖</span>
                <span class="nav-text">Chapter ${chapterNumber}: ${chapterTitle}</span>
                <span class="expand-icon">▶</span>
                <span class="status pending">○</span>
            </div>
            <div class="nav-subsections">
                ${subsections.map((subsection, index) => `
                    <div class="nav-subitem" data-target="ch${chapterNumber}-${index + 1}">
                        ${chapterNumber}.${index + 1} ${subsection}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Insert before references section
    const referencesSection = navMenu.querySelector('[data-target="references"]')?.parentElement;
    if (referencesSection) {
        referencesSection.insertAdjacentHTML('beforebegin', chapterHTML);
    } else {
        navMenu.insertAdjacentHTML('beforeend', chapterHTML);
    }
}

// Function to update chapter content from converted HTML
function updateChapterContent(chapterTarget, htmlContent) {
    const contentArea = document.getElementById('chapter-content');
    if (contentArea) {
        contentArea.innerHTML = htmlContent;
    }
}
// Handle coming soon items
document.addEventListener('DOMContentLoaded', () => {
    // Disable click events for coming soon items
    document.querySelectorAll('.nav-item.coming-soon, .nav-subitem.coming-soon').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Optional: Show a toast message
            showComingSoonMessage(item.querySelector('.nav-text').textContent);
        });
    });
});

// Function to show coming soon message
function showComingSoonMessage(chapterName) {
    // Create and show a temporary message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f59e0b;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        font-family: 'Source Sans Pro', sans-serif;
        font-size: 0.9rem;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    message.innerHTML = `
        <strong>${chapterName}</strong><br>
        <small>Coming soon! Currently being written.</small>
    `;
    
    document.body.appendChild(message);
    
    // Animate in
    setTimeout(() => {
        message.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        message.style.transform = 'translateX(100%)';
        setTimeout(() => {
            message.remove();
        }, 300);
    }, 3000);
}

// Update the getPlaceholderContent function to handle active chapters
const originalGetPlaceholderContent = window.thesisWebsite?.getPlaceholderContent || function() {};

function getPlaceholderContent(target) {
    const contentMap = {
        'abstract': {
            title: 'Abstract',
            content: 'This section contains your thesis abstract converted from Word to HTML.'
        },
        'table-of-contents': {
            title: 'Table of Contents',
            content: 'Complete table of contents with page numbers and section references.'
        },
        'chapter6': {
            title: 'Chapter 6: Experimental Design',
            content: 'This chapter outlines the comprehensive experimental design methodology. Paste your converted HTML from wordtohtml.net here.'
        },
        'chapter7': {
            title: 'Chapter 7: Comprehensive Walkthrough Analysis',
            content: 'Multi-Strategy Prompt Engineering analysis. You can paste the converted HTML from wordtohtml.net here.'
        },
        'appendix6': {
            title: 'Appendix 6: Performance Benchmarks',
            content: 'Detailed performance benchmarks and comparative analysis results.'
        },
        'appendix7': {
            title: 'Appendix 7: Implementation Details',
            content: 'Complete implementation specifications and technical documentation.'
        },
        'references': {
            title: 'References',
            content: 'Complete bibliography and reference list.'
        }
    };

    const content = contentMap[target] || {
        title: 'Chapter Content',
        content: 'Content for this section will be loaded here.'
    };

    return `
        <div class="chapter-content-area">
            <h1 style="color: #1e3a8a; margin-bottom: 1.5rem; font-size: 2rem;">${content.title}</h1>
            <div class="content-body">
                <p style="margin-bottom: 1rem; font-size: 1.1rem; line-height: 1.7;">${content.content}</p>
                <div style="margin-top: 2rem; padding: 1.5rem; background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 8px;">
                    <strong style="color: #0369a1;">Instructions for ${content.title}:</strong>
                    <ul style="margin-top: 0.5rem; margin-left: 1rem; color: #374151;">
                        <li>Convert your Word document section using <strong>wordtohtml.net</strong></li>
                        <li>Copy the generated HTML</li>
                        <li>Replace this placeholder with your converted content</li>
                        <li>The formatting will automatically match your academic theme</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}
