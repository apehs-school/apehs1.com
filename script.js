document.addEventListener("DOMContentLoaded", function () {
  // ==========================
  // DEVOTIONAL TAP CLOSE
  // ==========================
  const devotionalTap = document.getElementById("devotional-tap");
  const closeBtn = document.getElementById("close-devotional");
  if (closeBtn && devotionalTap) {
    closeBtn.addEventListener("click", () => {
      devotionalTap.style.display = "none";
    });
  }

  // ==========================
  // BACK TO TOP BUTTON
  // ==========================
  const backToTopBtn = document.getElementById("backToTop");
  if (backToTopBtn) {
    window.addEventListener("scroll", () => {
      backToTopBtn.style.display = window.scrollY > 400 ? "block" : "none";
    });
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ==========================
  // COUNTER ANIMATION
  // ==========================
  const counters = document.querySelectorAll(".counter");
  counters.forEach(counter => {
    counter.innerText = "0";
    const updateCounter = () => {
      const target = +counter.getAttribute("data-target");
      const current = +counter.innerText;
      const increment = Math.ceil((target - current) / 10);
      if (current < target) {
        counter.innerText = current + increment;
        setTimeout(updateCounter, 20);
      } else {
        counter.innerText = target;
      }
    };
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        updateCounter();
        observer.unobserve(counter);
      }
    }, { threshold: 0.5 });
    observer.observe(counter);
  });

  // ==========================
  // AOS ANIMATIONS
  // ==========================
  if (typeof AOS !== "undefined") {
    AOS.init({ duration: 1000, once: true });
  }

  // ==========================
  // CALENDAR & EVENTS
  // ==========================
  const calendarGrid = document.getElementById("calendarGrid");
  const eventList = document.getElementById("eventList");
  const prevBtn = document.getElementById("prevMonth");
  const nextBtn = document.getElementById("nextMonth");
  const monthYear = document.getElementById("monthYear");

  const events = {
   // ===== JANUARY =====
      "2026-01-05": ["Collection of School Fees"],
      "2026-01-06": ["Resumption of all Classes"],
      "2026-01-11": ["Earthquake Awareness Week Begins"],
      "2026-01-12": ["Earthquake Awareness Week Activities"],
      "2026-01-13": ["Earthquake Awareness Week Activities"],
      "2026-01-14": ["Earthquake Awareness Week Activities"],
      "2026-01-15": ["Earthquake Awareness Week Activities"],
      "2026-01-16": ["Earthquake Awareness Week Activities"],
      "2026-01-19": ["Mid-Year Exams (Grades 10–11) Begin"],
      "2026-01-20": ["Facts of Life Session (Guidance Dept.)"],
      "2026-01-21": ["Mid-Year Exams (Grades 7–9) Begin"],
      "2026-01-25": ["National STEAM Education Week Begins"],
      "2026-01-30": ["Pizza Day", "Mid-Year Exams End (All Grades)"],
      "2026-01-31": ["National STEAM Education Week Ends"],
      // ===== FEBRUARY =====
      "2026-02-04": ["World Read Aloud Day"],
      "2026-02-08": ["National Career Awareness Week Begins"],
      "2026-02-11": ["Good Deed Day"],
      "2026-02-13": ["Reports Submission Deadline (Teachers)"],
      "2026-02-18": ["Ash Wednesday"],
      "2026-02-19": ["Mid Term Break"],
      "2026-02-20": ["Mid Term Break"],
      "2026-02-23": ["Resumption of Classes"],
      "2026-02-26": ["General PTA Meeting"],
      "2026-02-27": ["Jamaica Day"],
      // ===== MARCH =====
      "2026-03-02": ["Badge Presentation"],
      "2026-03-03": ["Peace Day", "Collection of Reports (Grades 7–8)"],
      "2026-03-05": ["Collection of Reports (Grades 9–11)"],
      "2026-03-10": ["Photo Day"],
      "2026-03-11": ["Senior Management Meeting"],
      "2026-03-20": ["World Storytelling Day"],
      "2026-03-23": ["Mathematics Exposition Week Begins"],
      "2026-03-27": ["Mathematics Exposition Week Ends"],
      "2026-03-30": ["Jersey Day", "Egg Harvest"],
      // ===== APRIL =====
      "2026-04-01": ["Sports Day", "End of Term"],
      "2026-04-02": ["Easter Holiday Begins"],
      "2026-04-10": ["Easter Holiday Ends"],
      "2026-04-13": ["Collection of Vouchers"],
      "2026-04-14": ["Resumption of Classes", "Christian Emphasis Week Begins", "Grade 11 Mock Exams Begin"],
      "2026-04-17": ["Christian Emphasis Week Ends"],
      "2026-04-22": ["Grade 11 Mock Exams End"],
      "2026-04-23": ["Boys’ Day"],
      "2026-04-24": ["Fish Fry"],
      "2026-04-27": ["Alternate Method of Assessment Begins"],
      "2026-04-29": ["Grade 6 PEP Math Exam", "Grade 6 Language Arts Exam"],
      "2026-04-30": ["Grade 6 Ability Test"],
      // ===== MAY =====
      "2026-05-01": ["Alternate Method of Assessment"],
      "2026-05-04": ["Education Week Begins"],
      "2026-05-05": ["CSEC Exams Begin"],
      "2026-05-06": ["Teachers’ Day"],
      "2026-05-08": ["Education Week Ends"],
      "2026-05-14": ["Girls’ Day"],
      "2026-05-15": ["Good Deed Day"],
      "2026-05-18": ["Monthly Tests Begin"],
      "2026-05-21": ["Monthly Tests End"],
      "2026-05-22": ["May Fair"],
      "2026-05-25": ["Labour Day"],
      "2026-05-26": ["Mid Term"],
      "2026-05-28": ["JISA Prep Champs Begin"],
      "2026-05-29": ["Child’s Day"],
      "2026-05-30": ["JISA Prep Champs End"],
      // ===== JUNE =====
      "2026-06-16": ["End of Year Exams Begin (Grades 9–10)"],
      "2026-06-18": ["End of Year Exams Begin (Grades 7–8)"],
      "2026-06-24": ["Marking Day – No School"],
      "2026-06-30": ["Marking Day – No School", "End of Year Exams End"],
      // ===== JULY =====
      "2026-07-01": ["Prize Giving and Luncheon"],
      "2026-07-02": ["School Leaving Exercise"],
      "2026-07-06": ["Summer School Begins"],
      "2026-07-23": ["Summer School Ends", "Collection of Reports"],
      // ===== AUGUST =====
      "2026-08-31": ["Collection of Vouchers"],
      // ===== SEPTEMBER =====
      "2026-09-01": ["Collection of Vouchers"],
      "2026-09-02": ["Collection of Vouchers"],
      "2026-09-03": ["Collection of Vouchers"],
      "2026-09-04": ["Collection of Vouchers"],
      "2026-09-07": ["Resumption of Classes"]
  };

  let currentDate = new Date();

  function renderCalendar(date) {
    if (!calendarGrid) return;
    calendarGrid.innerHTML = "";
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    if (monthYear) monthYear.innerText = date.toLocaleString("default", { month: "long", year: "numeric" });

    for (let i = 0; i < firstDay; i++) calendarGrid.innerHTML += `<div></div>`;

    for (let day = 1; day <= lastDate; day++) {
      const fullDate = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      const hasEvent = events[fullDate] ? "has-event" : "";
      const dayDiv = document.createElement("div");
      dayDiv.className = `calendar-day ${hasEvent}`;
      dayDiv.innerText = day;
      dayDiv.addEventListener("click", () => showEvents(fullDate));
      calendarGrid.appendChild(dayDiv);
    }
  }

  function showEvents(date) {
    if (!eventList) return;
    eventList.innerHTML = "";
    if (events[date]) {
      events[date].forEach(event => {
        const li = document.createElement("li");
        li.innerText = event;
        eventList.appendChild(li);
      });
    } else {
      eventList.innerHTML = "<li>No events for this day</li>";
    }
  }

  if (prevBtn) prevBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  });
  if (nextBtn) nextBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  });

  renderCalendar(currentDate);

  });
