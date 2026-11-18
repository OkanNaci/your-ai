const STORAGE_KEY = "your-ai-portfolio-demo-v1";

function sample() {
  return {
    agents: [{
      id: "coach",
      name: "Interview Coach",
      instructions: "Coach junior developers for JavaScript interviews. Give one concrete example with each answer.",
    }],
    meetings: [{
      id: "practice",
      name: "Technical interview prep",
      agentId: "coach",
      agenda: "Practice answering a question about asynchronous JavaScript.",
      status: "upcoming",
      notes: "",
    }],
  };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved?.agents) && Array.isArray(saved?.meetings)) return saved;
  } catch {
    // The demo can still be used in a browser with storage disabled.
  }
  return sample();
}

const agents = document.querySelector("#agents");
const meetings = document.querySelector("#meetings");
const agentSelect = document.querySelector("#meeting-agent");
const status = document.querySelector("#status");
let state = load();
const noteDrafts = new Map();

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(label, handler, className) {
  const node = element("button", label, className);
  node.type = "button";
  node.addEventListener("click", handler);
  return node;
}

function save(message) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    message += " Browser storage is unavailable.";
  }
  render();
  status.textContent = message;
}

function addNotesForm(card, meeting) {
  const form = element("form");
  const notes = element("textarea");
  notes.id = "notes-" + meeting.id;
  notes.rows = 3;
  notes.value = noteDrafts.get(meeting.id) ?? "";
  notes.addEventListener("input", () => noteDrafts.set(meeting.id, notes.value));
  notes.maxLength = 2000;
  notes.placeholder = "Record a decision or next step.";
  const label = element("label", "Meeting notes");
  label.htmlFor = notes.id;
  const finish = element("button", "Finish meeting");
  finish.type = "submit";
  form.append(label, notes, finish);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    meeting.notes = notes.value.trim();
    noteDrafts.delete(meeting.id);
    changeStatus(meeting, "completed");
  });
  card.append(form);
}

function changeStatus(meeting, nextStatus) {
  meeting.status = nextStatus;
  save("Meeting " + nextStatus + ".");
  document.getElementById("meeting-" + meeting.id).focus();
}

function meetingCard(meeting) {
  const card = element("article", "", "record");
  const heading = element("div", "", "record-heading");
  const title = element("h3", meeting.name);
  title.id = "meeting-" + meeting.id;
  title.tabIndex = -1;
  heading.append(title, element("span", meeting.status, "tag"));
  const agent = state.agents.find(({ id }) => id === meeting.agentId);
  card.append(heading, element("p", "Agent: " + (agent?.name ?? "Unavailable")), element("p", meeting.agenda));

  if (meeting.status === "upcoming") {
    const actions = element("div", "", "actions");
    actions.append(
      button("Start meeting", () => changeStatus(meeting, "active")),
      button("Cancel meeting", () => changeStatus(meeting, "cancelled"), "quiet"),
    );
    card.append(actions);
  }
  if (meeting.status === "active") addNotesForm(card, meeting);
  if (meeting.status === "completed") card.append(element("p", meeting.notes || "No meeting notes."));
  return card;
}

function render() {
  agents.replaceChildren(...state.agents.map((agent) => {
    const card = element("article", "", "record");
    card.append(element("h3", agent.name), element("p", agent.instructions));
    return card;
  }));
  meetings.replaceChildren(...state.meetings.map(meetingCard));
  const selected = agentSelect.value;
  agentSelect.replaceChildren(...state.agents.map((agent) => {
    const option = element("option", agent.name);
    option.value = agent.id;
    return option;
  }));
  if (state.agents.some(({ id }) => id === selected)) agentSelect.value = selected;
}

function read(form, name) {
  const field = form.elements.namedItem(name);
  const value = field.value.trim();
  if (!value) {
    field.setCustomValidity("Enter a value.");
    field.reportValidity();
  }
  return value;
}

for (const field of document.querySelectorAll("input, textarea")) {
  field.addEventListener("input", () => field.setCustomValidity(""));
}

document.querySelector("#agent-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = read(form, "name");
  const instructions = read(form, "instructions");
  if (!name || !instructions) return;
  state.agents.unshift({ id: crypto.randomUUID(), name, instructions });
  form.reset();
  document.querySelector("#agent-editor").open = false;
  save("Agent saved.");
  document.querySelector("#agent-editor summary").focus();
});

document.querySelector("#meeting-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = read(form, "name");
  const agenda = read(form, "agenda");
  if (!name || !agenda) return;
  const id = crypto.randomUUID();
  state.meetings.unshift({ id, name, agenda, agentId: agentSelect.value, status: "upcoming", notes: "" });
  form.reset();
  document.querySelector("#meeting-editor").open = false;
  save("Meeting saved.");
  document.getElementById("meeting-" + id).focus();
});

document.querySelector("#reset").addEventListener("click", () => {
  if (!window.confirm("Reset this browser’s demo data?")) return;
  state = sample();
  noteDrafts.clear();
  save("Demo reset.");
});

render();
