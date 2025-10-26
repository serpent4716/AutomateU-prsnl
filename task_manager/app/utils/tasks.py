import requests
from bs4 import BeautifulSoup
import json
import csv
from datetime import datetime, timezone
import time
import re
import sys
import app.models as models 
from typing import List
import app.auth as auth
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os


engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_standalone_session():
    return SessionLocal()


class CollegeTaskExtractor:
    def __init__(self, base_url, username, password):
        self.base_url = base_url
        self.username = username
        self.password = password
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def login(self, login_url=None, username_field='username', password_field='password'):
        """Login to the college website"""
        if not login_url:
            login_url = f"{self.base_url}/login/index.php"
            
        try:
            login_page = self.session.get(login_url)
            soup = BeautifulSoup(login_page.content, 'html.parser')
            
            login_form = soup.find('form')
            if not login_form:
                print("Could not find login form")
                return False
                
            form_action = login_form.get('action', login_url)
            if form_action.startswith('/'):
                form_action = self.base_url + form_action
            elif not form_action.startswith(('http', 'https')):
                form_action = f"{self.base_url}/{form_action}"
            
            login_data = {
                username_field: self.username,
                password_field: self.password
            }
            
            hidden_inputs = soup.find_all('input', type='hidden')
            for hidden in hidden_inputs:
                name = hidden.get('name')
                value = hidden.get('value', '')
                if name:
                    login_data[name] = value
            
            response = self.session.post(form_action, data=login_data)
            
            if response.status_code == 200:
                if 'dashboard' in response.text.lower() or 'logout' in response.text.lower():
                    print("Login successful!")
                    return True
                else:
                    print("Login might have failed - no dashboard/logout found")
                    return False
            else:
                print(f"Login failed with status code: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"Login error: {str(e)}")
            return False
    
    def extract_course_info_via_ajax(self, courses_url=None):
        """Extract course information using AJAX API endpoints"""
        if not courses_url:
            courses_url = f"{self.base_url}/my/courses.php"
        
        try:
            print("Getting courses page to extract session info...")
            response = self.session.get(courses_url)
            
            if response.status_code != 200:
                print(f"Failed to access courses page. Status: {response.status_code}")
                return []
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract session key and user ID
            sesskey = self._get_sesskey(soup)
            user_id = self._get_user_id(soup)
            
            if not sesskey:
                print("Could not find session key")
                return []
                
            print(f"Found sesskey: {sesskey}")
            print(f"Found user_id: {user_id}")
            
            # Make AJAX request to get course data
            courses = self._fetch_courses_via_ajax(sesskey, user_id)
            
            return courses
            
        except Exception as e:
            print(f"Error extracting course info via AJAX: {str(e)}")
            return []
    
    def _fetch_courses_via_ajax(self, sesskey, user_id):
        """Fetch courses using the AJAX API"""
        try:
            ajax_url = f"{self.base_url}/lib/ajax/service.php"
            
            # Prepare the AJAX request payload
            payload = [{
                "index": 0,
                "methodname": "core_course_get_enrolled_courses_by_timeline_classification",
                "args": {
                    "offset": 0,
                    "limit": 0,
                    "classification": "inprogress",  # or "all", "future", "past"
                    "sort": "ul.timeaccess desc",
                    "customfieldname": "",
                    "customfieldvalue": ""
                }
            }]
            
            params = {
                'sesskey': sesskey,
                'info': 'core_course_get_enrolled_courses_by_timeline_classification'
            }
            
            headers = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json, text/javascript, */*; q=0.01'
            }
            
            print("Making AJAX request for course data...")
            response = self.session.post(ajax_url, params=params, json=payload, headers=headers)
            
            if response.status_code == 200:
                try:
                    json_response = response.json()
                    print("AJAX request successful!")
                    
                    # Extract course data from response
                    courses = []
                    if json_response and len(json_response) > 0:
                        course_data = json_response[0].get('data', {})
                        course_list = course_data.get('courses', [])
                        
                        for course in course_list:
                            course_info = {
                                'id': course.get('id'),
                                'fullname': course.get('fullname'),
                                'shortname': course.get('shortname'),
                                'href': f"{self.base_url}/course/view.php?id={course.get('id')}",
                                'categoryname': course.get('categoryname', ''),
                                'progress': course.get('progress', 0),
                                'startdate': course.get('startdate', 0),
                                'enddate': course.get('enddate', 0),
                                'lastaccess': course.get('lastaccess', 0)
                            }
                            courses.append(course_info)
                        
                        print(f"Found {len(courses)} courses via AJAX")
                        return courses
                    else:
                        print("No course data found in AJAX response")
                        return []
                        
                except json.JSONDecodeError:
                    print("Failed to parse AJAX response as JSON")
                    print("Response content:", response.text[:500])
                    return []
            else:
                print(f"AJAX request failed with status: {response.status_code}")
                print("Response:", response.text[:500])
                return []
                
        except Exception as e:
            print(f"Error in AJAX course fetch: {str(e)}")
            return []
    
    # def _try_alternative_ajax_method(self, sesskey, user_id):
    #     """Try alternative AJAX method to get courses"""
    #     try:
    #         ajax_url = f"{self.base_url}/lib/ajax/service.php"
            
    #         # Alternative payload - try the block_myoverview method
    #         payload = [{
    #             "index": 0,
    #             "methodname": "block_myoverview_get_enrolled_courses_by_timeline_classification",
    #             "args": {
    #                 "offset": 0,
    #                 "limit": 0,
    #                 "classification": "inprogress",
    #                 "sort": "ul.timeaccess desc",
    #                 "customfieldname": "",
    #                 "customfieldvalue": ""
    #             }
    #         }]
            
    #         params = {
    #             'sesskey': sesskey,
    #             'info': 'block_myoverview_get_enrolled_courses_by_timeline_classification'
    #         }
            
    #         headers = {
    #             'Content-Type': 'application/json',
    #             'X-Requested-With': 'XMLHttpRequest'
    #         }
            
    #         print("Trying alternative AJAX method...")
    #         response = self.session.post(ajax_url, params=params, json=payload, headers=headers)
            
    #         if response.status_code == 200:
    #             json_response = response.json()
    #             print("Alternative AJAX method successful!")
                
    #             courses = []
    #             if json_response and len(json_response) > 0:
    #                 course_data = json_response[0].get('data', {})
    #                 course_list = course_data.get('courses', [])
                    
    #                 for course in course_list:
    #                     course_info = {
    #                         'id': course.get('id'),
    #                         'fullname': course.get('fullname'),
    #                         'shortname': course.get('shortname'),
    #                         'href': f"{self.base_url}/course/view.php?id={course.get('id')}",
    #                         'categoryname': course.get('categoryname', ''),
    #                         'progress': course.get('progress', 0)
    #                     }
    #                     courses.append(course_info)
                    
    #                 return courses
                    
    #         return []
            
    #     except Exception as e:
    #         print(f"Error in alternative AJAX method: {str(e)}")
    #         return []
    
    def extract_tasks_from_course(self, course):
        """Extract tasks and resources from a specific course"""
        try:
            course_url = course.get('href')
            if not course_url:
                return [], [], []

            response = self.session.get(course_url)
            if response.status_code != 200:
                return [], [], []

            soup = BeautifulSoup(response.content, 'html.parser')

            activity_links = soup.find_all('a', href=re.compile(
                r'mod/(assign|quiz|resource|url|page|book)/view\.php\?id=\d+'
            ))

            tasks, resources = [], []

            for link in activity_links:
                task_name = link.get_text(strip=True)
                task_href = link.get('href')

                if not (task_name and task_href):
                    continue

                task_data = {
                    "course_id": course.get('id'),
                    "course_name": course.get('fullname'),
                    "task_name": task_name,
                    "task_url": task_href
                }

                if "assign" in task_href:
                    details = self.get_assignment_details(task_href)
                    task_data.update(details)
                    tasks.append(task_data)

                elif "quiz" in task_href:
                    # TODO: Similar get_quiz_details (structure same idea)
                    task_data["status"] = "TODO: implement quiz check"
                    task_data["description"] = ""
                    task_data["due_date"] = None
                    tasks.append(task_data)

                elif any(x in task_href for x in ["resource", "url", "page", "book"]):
                    resources.append(task_data)

            return tasks, resources

        except Exception as e:
            print(f"Error extracting tasks: {e}")
            return [], []


    def get_assignment_details(self, task_url):
        """Check assignment completion, deadlines, and description"""
        try:
            response = self.session.get(task_url)
            if response.status_code != 200:
                return {"status": "Unknown", "due_date": None, "description": ""}

            soup = BeautifulSoup(response.content, 'html.parser')

            # --- Extract dates ---
            due_date = None
            date_block = soup.find("div", class_="activity-dates")
            if date_block:
                for div in date_block.find_all("div"):
                    div_text = div.get_text().strip()
                    if div_text.startswith("Due:"):
                        due_text = div_text.replace("Due:", "").strip()
                        try:
                            parsed_date = datetime.strptime(due_text, "%A, %d %B %Y, %I:%M %p")
                            due_date = str(parsed_date)
                            break
                        except ValueError:
                            due_date = due_text
                            break
            # --- Extract submission status ---
            status = "Unknown"
            status_table = soup.find("table", class_="generaltable")
            if status_table:
                rows = status_table.find_all("tr")
                for row in rows:
                    header = row.find("th").get_text(strip=True).lower()
                    value = row.find("td").get_text(strip=True)
                    if "submission status" in header:
                        if "No submissions" in value:
                            status = "Not submitted"
                        elif "Submitted" in value:
                            status = "Submitted"
                        elif "Draft" in value:
                            status = "Draft"
                    elif "time remaining" in header and "overdue" in value.lower():
                        status = "Overdue"

            # --- Extract description ---
            desc_block = soup.find("div", class_="activity-description")
            description = desc_block.get_text(" ", strip=True) if desc_block else ""

            return {
                "status": status,
                "due_date": due_date,
                "description": description
            }

        except Exception as e:
            return {"status": f"Error: {str(e)}", "due_date": None, "description": ""}

    def extract_course_info(self, courses_url=None):
        """Main method to extract course information - tries AJAX first, then fallback"""
        # Try AJAX method first
        courses = self.extract_course_info_via_ajax(courses_url)
        
        if courses:
            return courses
        
        # Fallback to HTML parsing method
        print("AJAX method failed, trying HTML parsing...")
        return self._extract_from_html(courses_url)
    
    def _extract_from_html(self, courses_url=None):
        """Fallback method to extract from HTML"""
        if not courses_url:
            courses_url = f"{self.base_url}/my/courses.php"
        
        try:
            print("Waiting for page to load completely...")
            time.sleep(3)
            
            response = self.session.get(courses_url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for the course overview block specifically
            course_overview_block = soup.find('section', {'data-block': 'myoverview'})
            if not course_overview_block:
                print("Could not find course overview block")
                return []
            
            print("Found course overview block, waiting for content to load...")
            time.sleep(5)  # Wait longer for dynamic content
            
            # Re-fetch the page after waiting
            response = self.session.get(courses_url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for course data in various locations
            courses = []
            
            # Method 1: Look for data attributes in the course view container
            course_view = soup.find('div', {'data-region': 'courses-view'})
            if course_view:
                print("Found courses-view container")
                # Look for list items with course data
                course_items = course_view.find_all('li', {'data-course-id': True})
                for item in course_items:
                    course_id = item.get('data-course-id')
                    link = item.find('a', href=re.compile(r'course/view\.php'))
                    if link and course_id:
                        title = link.get_text(strip=True) or link.get('title', '')
                        courses.append({
                            'id': course_id,
                            'fullname': title,
                            'href': link.get('href'),
                            'shortname': title[:50] if title else f"Course {course_id}"
                        })
            
            # Method 2: Look in script tags for course data
            if not courses:
                print("Trying to extract from script tags...")
                scripts = soup.find_all('script')
                for script in scripts:
                    if script.string and 'courses' in script.string.lower():
                        # Try to find JSON data
                        import re
                        json_match = re.search(r'courses["\']?\s*:\s*(\[.*?\])', script.string, re.DOTALL)
                        if json_match:
                            try:
                                course_json = json.loads(json_match.group(1))
                                for course in course_json:
                                    if isinstance(course, dict) and 'id' in course:
                                        courses.append({
                                            'id': course.get('id'),
                                            'fullname': course.get('fullname', course.get('name', '')),
                                            'href': f"{self.base_url}/course/view.php?id={course.get('id')}",
                                            'shortname': course.get('shortname', '')
                                        })
                                break
                            except:
                                continue
            
            return courses
            
        except Exception as e:
            print(f"Error in HTML extraction: {str(e)}")
            return []
    
    def _get_sesskey(self, soup):
        """Extract session key from the page"""
        try:
            # Method 1: Look in M.cfg object
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string and 'M.cfg' in script.string:
                    import re
                    match = re.search(r'"sesskey":"([^"]+)"', script.string)
                    if match:
                        return match.group(1)
            
            # Method 2: Look for sesskey input
            sesskey_input = soup.find('input', {'name': 'sesskey'})
            if sesskey_input:
                return sesskey_input.get('value')
            
            # Method 3: Look in logout links
            logout_link = soup.find('a', href=re.compile(r'logout\.php.*sesskey='))
            if logout_link:
                href = logout_link.get('href')
                match = re.search(r'sesskey=([^&]+)', href)
                if match:
                    return match.group(1)
            
            return ''
            
        except Exception as e:
            print(f"Error getting sesskey: {str(e)}")
            return ''
    
    def _get_user_id(self, soup):
        """Extract user ID from the page"""
        try:
            # Look in profile links
            profile_link = soup.find('a', href=re.compile(r'user/profile\.php\?id='))
            if profile_link:
                href = profile_link.get('href')
                match = re.search(r'id=(\d+)', href)
                if match:
                    return match.group(1)
            
            # Look in data attributes
            user_elem = soup.find(attrs={'data-userid': True})
            if user_elem:
                return user_elem.get('data-userid')
            
            return None
            
        except Exception as e:
            print(f"Error getting user ID: {str(e)}")
            return None

    def filter_current_year_courses(self, courses): 
    
        filtered_courses = []
    
        current_patterns = [
            r'\b25-26\b',      # Matches 25-26
            r'\b2025-26\b',    # Matches 2025-26
            r'\b25\b(?!-)'     # Matches standalone 25 (not followed by -)
        ]
    
        previous_patterns = [
            r'\b24-25\b',
            r'\b2024-25\b',
            r'\b23-24\b',
            r'\b2023-24\b',
            r'\b22-23\b',
            r'\b2022-23\b',
            r'\b21-22\b',
            r'\b2021-22\b',
            r'\b24\b(?!-)',
            r'\b23\b(?!-)',
            r'\b22\b(?!-)',
            r'\b2024-2025\b'
        ]
    
        exclude_ids = {'2258', '2280', '2302', '2359', '2251', '2354'}  # set is faster for lookup
    
        for course in courses:
            course_name = course.get('fullname', '') + ' ' + course.get('shortname', '')
        
        # 1. Exclude by ID first
            if str(course.get('id')) in exclude_ids:
                print(f"Filtering out unwanted course by ID: {course.get('id')} - {course.get('fullname', 'N/A')}")
                continue
        
        # 2. Exclude if matches previous year patterns
            if any(re.search(pattern, course_name, re.IGNORECASE) for pattern in previous_patterns):
                print(f"Filtering out previous year course: {course.get('fullname', 'N/A')}")
                continue
        
        # 3. Keep if matches current year OR has no year info
            has_current_year = any(re.search(pattern, course_name, re.IGNORECASE) for pattern in current_patterns)
            has_any_year = has_current_year or any(re.search(pattern, course_name, re.IGNORECASE) for pattern in previous_patterns)
        
            if has_current_year or not has_any_year:
                filtered_courses.append(course)
                print(f"Keeping course: {course.get('fullname', 'N/A')}")
    
        return filtered_courses

    def filter_tasks_by_batch(self, tasks, batch_name):
        """
        Keep only tasks that match the given batch.
        - If no batch keyword is present, keep the task (applies to all).
        - If the task mentions another batch, drop it.
        """
        all_batches = ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4"]
        filtered = []

        for task in tasks:
            text = f"{task.get('task_name', '')} {task.get('description', '')}".upper()

            # Check which batches are mentioned in the text
            matches = [b for b in all_batches if b in text]

            if not matches:
                # No batch mentioned → keep
                filtered.append(task)
            elif batch_name.upper() in matches:
                # Matches the requested batch → keep
                filtered.append(task)
            # else: drop it (belongs to another batch)

        return filtered
    def save_tasks(self, tasks, format='json', filename=None):
        """Save tasks in specified format"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"courses_{timestamp}"
        
        if format.lower() == 'json':
            with open(f"{filename}.json", 'w', encoding='utf-8') as f:
                json.dump(tasks, f, indent=2, ensure_ascii=False)
            print(f"Tasks saved to {filename}.json")
    def separate_tasks(self, tasks):
        all_completed, all_incomplete = [], []

        for task in tasks:
            if "Submitted" in task.get("status", ""):
                all_completed.append(task)
            else:
                all_incomplete.append(task)

        # Sort by due date
        def sort_key(t): 
            due_str = t.get("due_date")
            try:
                return datetime.strptime(due_str, "%Y-%m-%d %H:%M:%S") if due_str else datetime.max
            except (ValueError, TypeError):
                return datetime.max

        all_completed.sort(key=sort_key)
        all_incomplete.sort(key=sort_key)

        return all_completed, all_incomplete

def main():
    # Configuration
    BASE_URL = "https://moodle.spit.ac.in"
    USERNAME = "arya.patel23"
    PASSWORD = "@Arya1411"
    BATCH = "B1"
    # Create extractor instance
    extractor = CollegeTaskExtractor(BASE_URL, USERNAME, PASSWORD)
    
    # Login
    if extractor.login():
        print("Successfully logged in!")
        
        # Extract course information using improved method
        courses = extractor.extract_course_info()
        
        if courses:
            print(f"\nFound {len(courses)} courses before filtering:")
            for i, course in enumerate(courses, 1):
                print(f"  {i}. {course.get('fullname', 'N/A')}")
            
            # Filter courses to keep only current year (2025-26) or courses without year info
            print(f"\nApplying year filter...")
            filtered_courses = extractor.filter_current_year_courses(courses)
            
            print(f"\nFound {len(filtered_courses)} courses after filtering:")
            for i, course in enumerate(filtered_courses, 1):
                print(f"\nCourse {i}:")
                print(f"  ID: {course.get('id')}")
                print(f"  Name: {course.get('fullname', 'N/A')}")
                print(f"  Short Name: {course.get('shortname', 'N/A')}")
                print(f"  URL: {course.get('href')}")
                if 'categoryname' in course:
                    print(f"  Category: {course.get('categoryname')}")
                if 'progress' in course:
                    print(f"  Progress: {course.get('progress')}%")
            
            # Save filtered course data
            extractor.save_tasks(filtered_courses, format='json', filename='courses_current_year')
            
            
            # Going in each course to extract the tasks
            all_tasks = []
            all_course_resources = []
            for course in filtered_courses:
                tasks, resources = extractor.extract_tasks_from_course(course)  # don't overwrite all_tasks
                if tasks:
                    all_tasks.extend(tasks)  # accumulate tasks
                else:
                    print(f"No tasks found for course: {course.get('fullname', 'N/A')}")
                if resources:
                    all_course_resources.extend(resources)
                else:
                    print(f"No resources found for course: {course.get('fullname', 'N/A')}")

            filtered_tasks = extractor.filter_tasks_by_batch(all_tasks, BATCH)
            # Save once after collecting all tasks
            completed, incomplete = extractor.separate_tasks(filtered_tasks)


            if all_tasks:
                extractor.save_tasks(all_tasks, format='json', filename="all_tasks_courses")
            
            if all_course_resources:
                extractor.save_tasks(all_course_resources, format='json', filename="all_course_resources")
                
            if completed:
                extractor.save_tasks(completed, format='json', filename="completed_tasks")
                
            if incomplete:
                extractor.save_tasks(incomplete, format='json', filename="incomplete_tasks")
        else:
            print("No courses found")
    else:
        print("Login failed")

# ----------------------------
# Your original function
# ----------------------------
def get_all_tasks(username: str, password: str, batch: str = "B1"):
    BASE_URL = "https://moodle.spit.ac.in"
    extractor = CollegeTaskExtractor(BASE_URL, username, password)

    if not extractor.login():
        raise Exception("Login failed")

    courses = extractor.extract_course_info()
    if not courses:
        return {"completed": [], "incomplete": []}

    filtered_courses = extractor.filter_current_year_courses(courses)

    all_tasks = []
    for course in filtered_courses:
        tasks, _ = extractor.extract_tasks_from_course(course)
        if tasks:
            all_tasks.extend(tasks)

    filtered_tasks = extractor.filter_tasks_by_batch(all_tasks, batch)
    completed, incomplete = extractor.separate_tasks(filtered_tasks)

    return {"completed": completed, "incomplete": incomplete}


# ----------------------------
# New wrapper for DB storage
# ----------------------------
def fetch_and_store_moodle_tasks(user_id: int) -> List[models.Task]:
    """
    Fetch Moodle tasks for a given user, create new tasks, update the status
    of existing tasks, and update last_synced_at.
    """
    db = get_standalone_session()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        # Exit early if the user or Moodle account isn't set up for auto-sync
        if not user or not user.moodle_account or not user.moodle_account.auto_sync:
            return []

        moodle_account = user.moodle_account
        password = auth.decrypt_password(moodle_account.password)

        # Fetch all tasks from Moodle, which returns a dict like {"completed": [...], "incomplete": [...]}
        tasks_data = get_all_tasks(
            username=moodle_account.username,
            password=password,
            batch=moodle_account.batch,
        )

        # Fetch existing Moodle tasks from our DB, keyed by task_url for efficient O(1) lookups
        existing_tasks = {
            t.task_url: t
            for t in db.query(models.Task)
            .filter(models.Task.user_id == user.id, models.Task.is_moodle_task == True)
            .all()
            if t.task_url
        }

        tasks_to_create = []

        # Iterate through both "completed" and "incomplete" tasks from Moodle
        for status, moodle_tasks in tasks_data.items():
            moodle_is_complete = (status == "completed")

            for moodle_task in moodle_tasks:
                task_url = moodle_task.get("task_url")
                if not task_url:
                    continue  # Skip tasks without a URL, as it's our unique identifier

                # --- KEY CHANGE: LOGIC TO HANDLE EXISTING TASKS ---
                # Case 1: The task already exists in our database.
                if task_url in existing_tasks:
                    db_task = existing_tasks[task_url]
                    new_status = models.TaskStatus.DONE if moodle_is_complete else models.TaskStatus.TODO

                    # Only update the database if the status has actually changed
                    if db_task.status != new_status:
                        db_task.status = new_status
                
                # Case 2: The task is new and needs to be created.
                else:
                    due_date = None
                    if moodle_task.get("due_date"):
                        try:
                            due_date = datetime.strptime(moodle_task["due_date"], "%Y-%m-%d %H:%M:%S")
                        except ValueError:
                            due_date = None
                    
                    new_task = models.Task(
                        title=moodle_task.get('course_name', 'Unknown Course'),
                        desc=moodle_task.get('description', ''),
                        due_date=due_date,
                        status=models.TaskStatus.DONE if moodle_is_complete else models.TaskStatus.TODO,
                        priority=models.TaskPriority.MEDIUM,
                        estimated_hours=2,
                        user_id=user.id,
                        is_moodle_task=True,
                        tags=["moodle"],
                        task_url=task_url
                    )
                    tasks_to_create.append(new_task)

        # Add all newly created tasks to the database session
        if tasks_to_create:
            db.add_all(tasks_to_create)

        # Always update the last sync time
        moodle_account.last_synced_at = datetime.now(timezone.utc)

        # Commit all changes (new tasks AND status updates) in a single transaction
        db.commit()

        return tasks_to_create

    finally:
        # Best practice: ensure the database session is always closed
        db.close()



if __name__ == "__main__":
    sys.stdout = sys.__stdout__  # Reset stdout to default
    sys.stdout = open("output1.txt", "w", encoding="utf-8")  # Redirect output to a file
    main()
    sys.stdout.close()