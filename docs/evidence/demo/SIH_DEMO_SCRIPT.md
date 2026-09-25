# SIH 5-Minute Prototype Demo Script

## 00:00 — Problem and FlashGuard Concept
*(Show slide or brief intro)*
"During flash floods, authorities face a critical issue: they have raw data, but lack actionable intelligence. They don't know *where* to deploy teams first, or *why* a location is failing. FlashGuard AI bridges this gap. It turns raw sensor data and spatial topography into explainable decision intelligence."

## 00:30 — Command Center
*(Open application at `/`)*
"This is our Command Center. It integrates all live telemetry. Instantly, decision-makers see the macro view: how many critical locations exist, active alerts, and a sorted priority response list. This ensures immediate situational awareness."

## 01:00 — Risk Map
*(Navigate to `/risk-map`)*
"If we move to the Risk Map, we see the spatial distribution of hazard zones. Our system maps out locations and colors them by real-time risk severity calculated from our backend engine."

## 01:30 — Select Vulnerable Village
*(Click on a Red/Critical dot on the map)*
"Let's click on this critical location. The system immediately pulls up a detailed profile."

## 02:00 — Explain Catchment/Risk Drivers
*(Scroll through the open drawer on `/risk-map`)*
"Crucially, FlashGuard is explainable. It tells us *why* the risk is high. Here, we see the exact top drivers: steep slope combined with intense local rainfall. Because we model the Catchment Digital Twin, the system also analyzes upstream context—warning us if risk is escalating due to upstream accumulation rather than just local rain."

## 02:30 — What-If Rainfall Scenario
*(Navigate to `/scenarios`)*
"We don't just react; we prepare. In the Scenario Simulator, emergency planners can ask: 'What if rainfall increases by 50% over the next hour?'"
*(Adjust slider and run)*
"The system recalculates the risk for all locations instantly. Notice the Rank Delta—we can see exactly which locations jump to the top of the priority list under this new scenario."

## 03:15 — Priority Center
*(Navigate to `/priorities`)*
"FlashGuard does not dispatch based purely on water levels. Our Priority Center calculates a composite score. We multiply the physical Hazard by human Exposure and infrastructural Vulnerability, factored by Time Criticality. This ensures teams are sent where lives are most threatened."

## 04:00 — Alert Center
*(Navigate to `/alerts`)*
"When thresholds are breached, the system deterministically triggers alerts. These are logged here, ensuring a permanent audit trail of critical events."

## 04:20 — Evacuation Planner
*(Navigate to `/evacuation`)*
"Finally, we must act safely. If we need to evacuate a village to a safe zone, standard GPS might route teams through flooded valleys. Our Evacuation Planner calculates routes and cross-references them with our flood risk map. It compares alternatives and explicitly recommends the route with the lowest flood exposure."

## 04:50 — Final Decision-Intelligence Value
"In conclusion, FlashGuard AI transforms chaotic flood data into a structured pipeline: Sense, Understand, Predict, Simulate, and Act. It is a complete, scalable decision intelligence platform ready to save lives."
