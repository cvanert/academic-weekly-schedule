var scheduleController = (function() {

    var Course = function(id, name, number, mode, days, startTime, endTime, building, room, faculty, department, startDate, endDate, color) {
        this.id = id;
        this.name = name;
        this.number = number;
        this.mode = mode;
        this.days = days;
        this.startTime = startTime;
        this.endTime = endTime;
        this.building = building;
        this.room = room;
        this.faculty = faculty;
        this.department = department;
        this.startDate = startDate;
        this.endDate = endDate;
        this.color = color;
        this.positions = -1;
    };

    Course.prototype.findPositions = function(data) {
        var course, sTimeID, eTimeID, daysArr, days, daysTimesID;
        sTimeID = convertTimeToCalendar(this.startTime);
        eTimeID = convertTimeToCalendar(this.endTime);
        days = this.days.split(',');
        daysTimesID = [];
        days.forEach(function(day) {
            daysTimesID.push([day.toLowerCase().trim() + sTimeID, day.toLowerCase().trim() + eTimeID]);
        });
        this.positions = daysTimesID;
    };

    Course.prototype.getPositions = function() {
        return this.positions;
    };

    var Term = function(term, year, currentDate) {
        this.term = term;
        this.year = year;
        this.currentDate = currentDate;
    };

    var convertTimeToCalendar = function(time) {
        var timeArr, hour12, hour24, timeID, updatedTimeArr;
        timeArr = time.split(' ');
        updatedTimeArr = timeArr[0].split(':');
        hour12 = updatedTimeArr[0];
        if (timeArr[1] === 'AM') {
            if (+(hour12) === 12) {
                timeID = '00' + updatedTimeArr[1];
            } else if (+(hour12) < 10) {
                timeID = '0' + timeArr[0].split(':').join('');
            } else {
                timeID = timeArr[0].split(':').join('');
            }
        } else if (+(hour12) === 12) {
                timeID = timeArr[0].split(':').join('');
        } else {
            hour24 = (+(hour12) + 12).toString();
            updatedTimeArr.shift();
            updatedTimeArr.unshift(hour24);
            timeID = updatedTimeArr.join('');
        }
        return timeID;
    };

    var data = {
        allCourses: [],
        online: 0,
        currentTerm: [],
    };

    return {
        addCourse: function(cName, cNumber, cMode, cDays, cStartTime, cEndTime, cBuilding, cRoom, cFaculty, cDepartment, cStartDate, cEndDate, cColor) {
            var newCourse, ID;
            if (data.allCourses.length > 0) {
                ID = data.allCourses[data.allCourses.length - 1].id + 1;
            } else {
                ID = 0;
            }
            // Create new course
            newCourse = new Course(ID, cName, cNumber, cMode, cDays, cStartTime, cEndTime, cBuilding, cRoom, cFaculty, cDepartment, cStartDate, cEndDate, cColor);
            // Push new course to data structure
            data.allCourses.push(newCourse);
            // Return new element
            return newCourse;
        },

        addTerm: function(aTerm, aYear, aCurrentDate) {
            var newTerm = new Term(aTerm, aYear, aCurrentDate);
            data.currentTerm.push(newTerm);
            return newTerm;
        },

        findPositionIDs: function() {
            data.allCourses.forEach(function(cur) {
                cur.findPositions();
            });
        },

        getPositionIDs: function() {
            var allPositions = data.allCourses.map(function(cur) {
                return cur.getPositions();
            });
            return allPositions;
        },

        testing: function() {
            console.log(data);
        },
    }

})();



var interfaceController = (function() {
    var onlineStart = 0;

    var domStrings = {
        inputName: '.add_course_name',
        inputNumber: '.add_course_number',
        inputMode: '.mode',
        inputDays: '.days_container',
        inputStartTime: '.add_start_time',
        inputEndTime: '.add_end_time',
        inputBuilding: '.add_building',
        inputRoom: '.add_room',
        inputFaculty: '.add_faculty',
        inputDepartment: '.add_department',
        inputStartDate: '.add_start_date',
        inputEndDate: '.add_end_date',
        inputColor: '.add_color',
        inputButton: '.add_button',
        courseContainer: '.courses_list',
        calendarContainer: '.calendar_container',
        eventOverlayContainer:'.event_overlay_container',
        termTitle: '.term_title',
        termInput: '.add_term_label',
        yearInput: '.term_year_label',
        currentDate: '.current_date_input',
        updateTermButton: '.term_input_button',
        currentMonth: '.current_month',
        calendarTable: '.calendar_week',
    };

    var getSelectedValue = function(form, name) {
        var selection, options;
        selection = [];
        options = form.elements[name];
        for (var i = 0; i < options.length; i++) {
            if (options[i].checked) {
                selection.push(options[i].value);
            }
        }
        if (selection.length <= 1) {
            if (selection.join() === 'Other') {
                return document.getElementById('other_course_type_input').value;
            } else {
                return selection.join();
            }
        } else {
            return selection.slice(0, -1).join(', ') + ', ' + selection.slice(-1);
        }
    };

    // Convert obj.start/endTime to time object
    var timeObject = function(str) {
        var timeString, timeFull;
        if (str.length === 0) {
            return '';
        } else {
            timeString = str.split(':');
            timeFull = new Date(null, null, null, timeString[0], timeString[1]);
            return new Intl.DateTimeFormat('en-US', { hour12: true, hour: 'numeric', minute: 'numeric' }).format(timeFull);
        }
    };

    // Convert obj.currentDate to month
    var getCurrentMonth = function(d) {
        var date, month, m;
        date = new Date(d);
        month = date.getMonth();
        m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return m[month];
    };

    var getCurrentDay = function(d) {
        var date, day;
        date = new Date(d);
        return date.getDay();
    };

    // Determine if color selected (if not allows for default)
    var selectedColor = function() {
        if (document.querySelectorAll('.add_color_selected').length === 0) {
            return '';
        } else {
            return document.querySelector('.add_color_selected').getAttribute('value');
        }
    };

    var calcQHourRows = function(str) {
        var timeString, hours, minutes, positionMinutes, percent;
        timeString = (+(str.slice(2)) - 600).toString();
        hours = +(timeString.slice(0, timeString.length - 2));
        minutes = +(timeString.slice(-2));
        if (minutes % 15 === 0) {
            positionMinutes = minutes / 15;
        } else if (minutes % 15 <= 7) {
            positionMinutes = (minutes - (minutes % 15)) / 15;
        } else {
            positionMinutes = (minutes - (minutes % 15) + 15) / 15;
        }
        return (hours * 4) + positionMinutes;
    };

    var calcPosition = function(n) {
        var calContainer, calContainerH, calContainerW, calBody, calBodyH, calBodyW, nH;
        calContainer = document.querySelector('.calendar_container');
        calContainerH = calContainer.offsetHeight;
        calContainerW = calContainer.offsetWidth;
        calBody = document.querySelector('.tbody');
        calBodyH = calBody.offsetHeight;
        calHeadH = calContainerH - calBodyH;
        nH = (n / 68) * calBodyH;
        return ((nH + calHeadH) / calContainerH) * 100;
    };

    var calcEventHeight = function(str1, str2) {
        var hours1, hours2, min1, min2, hDif, mDif, positionMinutes, percent;
        hours1 = +(str1.slice(0, str1.length - 2));
        hours2 = +(str2.slice(0, str2.length - 2));
        min1 = +(str1.slice(-2));
        min2 = +(str2.slice(-2));
        hDif = hours2 - hours1;
        mDif = Math.abs(min2 - min2);

        if (mDif % 15 === 0) {
            positionMinutes = mDif / 15;
        } else if (mDif % 15 <= 7) {
            positionMinutes = (mDif - (mDif % 15)) / 15;
        } else {
            positionMinutes = (mDif - (mDif % 15) + 15) / 15;
        }
        return (hDif * 4) + (positionMinutes);
    };

    // Calculate left
    var calcEventLeft = function(str) {
        var removeTime, x;
        removeTime = str.slice(0, 2);
        switch(removeTime) {
            case 'su': 
                x = 12.5;
                break;
            case 'mo': 
                x = 12.5 * 2;
                break;
            case 'tu': 
                x = 12.5 * 3;
                break;
            case 'we': 
                x = 12.5 * 4;
                break;
            case 'th': 
                x = 12.5 * 5;
                break;
            case 'fr': 
                x = 12.5 * 6;
                break;
            case 'sa': 
                x = 12.5 * 7;
                break;
        }
        return x
    };

    // NodeList forEach function
    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    return {
        getInput: function() {
            return {
                name: document.querySelector(domStrings.inputName).value,
                number: document.querySelector(domStrings.inputNumber).value,
                mode: getSelectedValue(document.getElementById('add_course_form'), 'add_mode_of_instruction'),
                days: getSelectedValue(document.getElementById('add_course_form'), 'add_class_day'),
                startTime: timeObject(document.querySelector(domStrings.inputStartTime).value),
                endTime: timeObject(document.querySelector(domStrings.inputEndTime).value),
                building: document.querySelector(domStrings.inputBuilding).value,
                room: document.querySelector(domStrings.inputRoom).value,
                faculty: document.querySelector(domStrings.inputFaculty).value,
                department: document.querySelector(domStrings.inputDepartment).value,
                startDate: document.querySelector(domStrings.inputStartDate).valueAsDate,
                endDate: document.querySelector(domStrings.inputEndDate).valueAsDate,
                color: selectedColor(),           
            };

        },

        getTermInput: function() {
            return {
                term: document.querySelector(domStrings.termInput).value,
                year: document.querySelector(domStrings.yearInput).value,
                currentDate: document.querySelector(domStrings.currentDate).valueAsDate,
            };
        },

        addTermInformation: function(obj) {
            var element, html, newHtml;
            element = domStrings.termTitle;
            html = '<h2 class="term_season">%Term% %Year%</h2>';
            newHtml = html.replace('%Term%', obj.term);
            newHtml = newHtml.replace('%Year%', obj.year);
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },

        addCourseToCourseContainer: function(obj) {
            var element, sDate, eDate, html, newHtml;
            element = domStrings.courseContainer;
            sDate = new Intl.DateTimeFormat('en-US').format(obj.startDate);
            eDate = new Intl.DateTimeFormat('en-US').format(obj.endDate);
            html = '<div class="added_courses" id="course_%id%"> <div class="course_title" id="title_%Title%"">%Number% - %Name%</div> <div class="course_info"> <div class="course_mode_container"> <div class="course_mode">%Mode%</div> </div> <div class="course_days_container"> <div class="course_days">%Days%</div> </div> <div class="course_times_container"> <div class="course_time">%12:00AM% - %12:59AM%</div> </div> <div class="course_location_container"> <div class="course_building">%Building%</div> <div class="course_room">%Room%</div> </div> <div class="course_faculty_container"> <div class="course_faculty">%Faculty%</div> <div class="course_department">%Department%</div> </div> <div class="course_dates_container"> <div class="course_dates">%Start% - %End%</div> </div> </div> </div>';
            // Replace placeholder with actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%Title%', obj.id);
            newHtml = newHtml.replace('%Number%', obj.number);
            newHtml = newHtml.replace('%Name%', obj.name);
            newHtml = newHtml.replace('%Mode%', obj.mode);
            newHtml = newHtml.replace('%Days%', obj.days);
            newHtml = newHtml.replace('%12:00AM%', obj.startTime);
            newHtml = newHtml.replace('%12:59AM%', obj.endTime);
            newHtml = newHtml.replace('%Building%', obj.building);
            newHtml = newHtml.replace('%Room%', obj.room);
            newHtml = newHtml.replace('%Faculty%', obj.faculty);
            newHtml = newHtml.replace('%Department%', obj.department);
            newHtml = newHtml.replace('%Start%', sDate);
            newHtml = newHtml.replace('%End%', eDate);
            // Insert HTML into DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },

        updateCalendarMonth: function(obj) {
            var element, month;
            console.log(obj.currentDate);
            month = getCurrentMonth(obj.currentDate);
            element = domStrings.calendarTable;
            document.getElementById('calendar_month').innerHTML = month;
        },

        updateCurrentDay: function(obj) {
            var daysArr, day, current, today;
            daysArr = document.getElementsByClassName('date');
            day = getCurrentDay(obj.currentDate);
            console.log(day);
            current = document.getElementsByClassName('active');
            document.getElementById('date-' + day).classList.toggle('active');
        },

        // Create divs
        addCoursetoCalendar: function(obj) {
            var element, events, html, newHtml;
            element = domStrings.eventOverlayContainer;
            if (obj.mode === 'Online') {
                html = '<div class="event event_%id%" id="%i%"> <div class="event_title"> <div class="event_number">%Number%</div> <div class="event_name">%Name%</div> </div> </div>';
                newHtml = html.replace('%id%', obj.id);
                newHtml = newHtml.replace('%i%', i);
                newHtml = newHtml.replace('%Number%', obj.number);
                newHtml = newHtml.replace('%Name%', obj.name);
                document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
            } else {
                events = obj.days.split(',');
                for (var i = 0; i < events.length; i++) {
                    html = '<div class="event event_%id%" id="%i%"> <div class="event_title"> <div class="event_number">%Number%</div> <div class="event_name">%Name%</div> </div> </div>';
                    newHtml = html.replace('%id%', obj.id);
                    newHtml = newHtml.replace('%i%', i);
                    newHtml = newHtml.replace('%Number%', obj.number);
                    newHtml = newHtml.replace('%Name%', obj.name);
                    document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
                };
            };      
        },

        clearCourseFields: function() {
            var fields, fieldsArr, form, mode, days;
            fields = document.querySelectorAll(domStrings.inputName + ',' + domStrings.inputNumber + ',' + domStrings.inputStartTime + ',' + domStrings.inputEndTime + ',' + domStrings.inputBuilding + ',' + domStrings.inputRoom + ',' + domStrings.inputFaculty + ',' + domStrings.inputDepartment + ',' + domStrings.inputDepartment + ',' + domStrings.inputStartDate + ',' + domStrings.inputEndDate);
            fieldsArr = Array.prototype.slice.call(fields);
            fieldsArr.forEach(function(current, index, array) {
                current.value = "";
            });
            form = document.getElementById('add_course_form');
            mode = document.getElementById('add_course_form').elements['add_mode_of_instruction'];
            for (var i = 0; i < mode.length; i++) {
                mode[i].checked = false; 
            };
            options = document.getElementById('add_course_form').elements['add_class_day'];
            for (var i = 0; i < options.length; i++) {
                options[i].checked = false; 
            };
        },

        clearColor: function() {
            var colorArr, lastSelection, currentSelection, desiredColor;
            colorArr = document.getElementsByClassName('add_color');
            for (var i = 0; i < colorArr.length; i++) {
                colorArr[i].classList.remove('add_color_selected');
            }
        },

        clearCurrentFields: function() {
            var fields, fieldsArr;
            fields = document.querySelectorAll(domStrings.termTitle + ',' + domStrings.termInput + ',' + domStrings.yearInput);
            fieldsArr = Array.prototype.slice.call(fields);
            fieldsArr.forEach(function(current, index, array) {
                current.value = "";
            });
        },

        // Position divs
        positionOnCalendar: function(obj) {
            var eventDivs, eventsTotal, event, positions, timePositions, eventStartTime, eventEndTime, eventHeight, eventLeft;
            eventDivs = document.querySelectorAll('.event_' + obj.id);
            eventsTotal = obj.days.length;
            positions = obj.positions;
            nodeListForEach(eventDivs, function(cur, index) {
                event = eventDivs[index];
                timePositions = positions[index];
                eventStartTime = calcQHourRows(timePositions[0]);
                eventEndTime = calcQHourRows(timePositions[1]);
                eventHeight = calcEventHeight(timePositions[0].slice(2), timePositions[1].slice(2));
                eventLeft = calcEventLeft(timePositions[1]);
                event.style.top = calcPosition(eventStartTime) - 1 + '%';
                event.style.height = calcPosition(eventEndTime) - calcPosition(eventStartTime) - 1.5 + '%';
                event.style.left = eventLeft + '%';
                event.style.width = '10%';
                console.log(eventStartTime, eventHeight, eventEndTime, eventLeft)
            });
        },

        positionOnlineOnCalendar: function(obj, count) {
            var event, calContainer, calContainerH, calContainerW, calBody, calBodyH, calHour, eventStartTime, eventEndTime, eventWidth;
            event = document.querySelector('.event_' + obj.id);
            calContainer = document.querySelector('.calendar_container');
            calContainerH = calContainer.offsetHeight;
            calContainerW = calContainer.offsetWidth;
            calBody = document.querySelector('.tbody');
            calBodyH = calBody.offsetHeight;
            calHour = (((1 / 17) * calBodyH) / calContainerH) * 100;
            if (count < 2) {
                eventStartTime = ((count - 1) * calHour) + ((calContainerH - calBodyH) / calContainerH);
            } else {
                eventStartTime = onlineStart;
            }
            eventEndTime = count * calHour;
            event.style.top = calcPosition(eventStartTime) + '%';
            event.style.height = (5 - 3) * 0.75 + '%';
            event.style.left = '13%';
            event.style.width = '84%';
            onlineStart = eventEndTime * 0.75;
            console.log(eventStartTime, eventEndTime, onlineStart)
        },

        selectColor: function() {
            var colorArr, lastSelection, currentSelection, desiredColor;
            colorArr = document.getElementsByClassName('add_color');
            lastSelection = '';
            for (var i = 0; i < colorArr.length; i++) {
                colorArr[i].addEventListener('click', function(event) {
                    currentSelection = event.target.id;
                    if (lastSelection === '') {
                        lastSelection = currentSelection;
                        document.getElementById(lastSelection).classList.add('add_color_selected');
                    } else if (lastSelection !== currentSelection) {
                        document.getElementById(lastSelection).classList.remove('add_color_selected');
                        document.getElementById(currentSelection).classList.add('add_color_selected');
                        lastSelection = currentSelection;
                    } else {
                        document.getElementById(currentSelection).classList.add('add_color_selected');
                    }
                })
            }
        },

        updateCourseColor: function(obj) {
            var value, cContainer, cTitle, eContainer;
            value = obj.color;
            cContainer = document.getElementById('course_' + obj.id);
            cTitle = document.getElementById('title_' + obj.id);
            eContainer = document.getElementsByClassName('event_' + obj.id);
            if (obj.color !== '') {
                cContainer.style.setProperty('border', '1px solid' + value);
                cTitle.style.setProperty('background-color', value);
                for (var i = 0; i < eContainer.length; i++) {
                    eContainer[i].style.setProperty('border', '1px solid ' + value);
                    eContainer[i].style.setProperty('background-color', value);
                    eContainer[i].style.setProperty('opacity', '0.6')
                    if (value == '#FF2400' || value == '#FF7B00' || value == '#FF1493' || value == '#990099' || value == '#660099' || value == '#0000FF' || value == '#009A00') {
                        eContainer[i].style.setProperty('color', '#FFF');
                    } else if (value == '#FFEA00' || value == '#CCFF00' || value == '#00FF00') {
                        eContainer[i].style.setProperty('color', '#000');
                    }
                }
                if (value == '#FF2400' || value == '#FF7B00' || value == '#FF1493' || value == '#990099' || value == '#660099' || value == '#0000FF' || value == '#009A00') {
                    cTitle.style.setProperty('color', '#FFF');
                } else if (value == '#FFEA00' || value == '#CCFF00' || value == '#00FF00') {
                    cTitle.style.setProperty('color', '#000');
                }
            }
        },

        getDOMStrings: function() {
            return domStrings;
        }
    }

})();



// appController
var appController = (function(scheduleC, interfaceC) {
    var onlineCount = 0;

    var setupEventListeners = function() {
        var dom = interfaceC.getDOMStrings();
        document.querySelector(dom.inputButton).addEventListener('click', appAddCourse);
        document.querySelector(dom.inputColor).addEventListener('change', interfaceC.updateCourseColor);
        document.querySelector(dom.updateTermButton).addEventListener('click', appCurrent);
    };

    var updatePositions = function() {
        // Calculate positions
        scheduleC.findPositionIDs();
        // Read positions from schedule controller
        var positions = scheduleC.getPositionIDs();
        // Update UI
    };

    var appCurrent = function() {
        var input, newTerm;
        input = interfaceC.getTermInput();
        console.log(input);
        newTerm = scheduleC.addTerm(input.term, input.year, input.currentDate);
        interfaceC.addTermInformation(newTerm);
        interfaceC.updateCalendarMonth(newTerm);
        interfaceC.updateCurrentDay(newTerm);
        interfaceC.clearCurrentFields();
    };

    var appAddCourse = function() {
        var input, newCourse, positions;
        // Get the field input data
        input = interfaceC.getInput();
        if (input.name !== '') {
            if (input.mode === 'Online') {
                onlineCount++;
                // Add course to scheduleController
                newCourse = scheduleC.addCourse(input.name, input.number, input.mode, 'N/A', 'N/A', '', 'N/A', '', input.faculty, input.department, input.startDate, input.endDate, input.color);
                // Add course to interface course container
                interfaceC.addCourseToCourseContainer(newCourse);

                // Add course to interface calendar
                interfaceC.addCoursetoCalendar(newCourse);
                
                // Update color
                interfaceC.updateCourseColor(newCourse);

                // Position event divs
                interfaceC.positionOnlineOnCalendar(newCourse, onlineCount); 
                
                // Clear fields
                interfaceC.clearCourseFields();
                interfaceC.clearColor();
            } else {
                // Add course to scheduleController
                newCourse = scheduleC.addCourse(input.name, input.number, input.mode, input.days, input.startTime, input.endTime, input.building, input.room, input.faculty, input.department, input.startDate, input.endDate, input.color);
                
                // Add course to interface course container
                interfaceC.addCourseToCourseContainer(newCourse);

                // Add course to interface calendar
                interfaceC.addCoursetoCalendar(newCourse);
                
                // Add positions to newCourse
                updatePositions();

                // Update color
                interfaceC.updateCourseColor(newCourse);

                // Position event divs
                interfaceC.positionOnCalendar(newCourse); 
                
                // Clear fields
                interfaceC.clearCourseFields();
                interfaceC.clearColor();
            }
        }
    };

    return {
        init: function() {
            console.log('Schedule has started');
            interfaceC.selectColor();
            setupEventListeners();
        }
    }

})(scheduleController, interfaceController);

appController.init();