/* -------- Helpers -------- */
function money(n){
  const v = Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  return "$" + v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
}
function num(id){ const v = parseFloat(document.getElementById(id).value); return isNaN(v) ? 0 : v; }
function setVal(id,v){ const el=document.getElementById(id); if(el) el.value=v; }
function html(id,s){ const el=document.getElementById(id); if(el) el.innerHTML=s; }

/* -------- Global state -------- */
let CONFIG = null;
const FALLBACK_CONFIG = {
  meta:{version:1},
  defaults:{
    adults:2, children:1, nights:5, useSOG:false,
    ticket:{adultPre:753.83, childPreEstimated:699.00, taxPct:6.5, sogDiscPct:20, childFallback:true},
    roomStandard:{preTaxTotal:563, roomTaxPct:12.5, resortNight:36, resortTaxPct:12.5, parkingNightWithTax:33.75},
    roomSOG:{night:184, parkingNight:24},
    fly:{travelers:3, pricePer:340, pitDays:6, pitGas:40, pitParkPer:13, transferMode:"bus", busFare:2, uberRoundTrip:100},
    drive:{milesRT:2200, mpg:22, gasPrice:3.04, hotelNights:2, hotelPer:120, roadFoodPerDay:60, roadDays:4, parkDriveDays:0, parkParkingPer:35, useHotelParking:true, movingHoursOneWay:16.5, hoursPerDay:8, breakEveryHours:2.5, breakMinutesEach:20, fuelStopsRT:6, fuelStopMinutesEach:10},
    stay:{foodDays:5, foodPerDay:100, souvenirs:500}
  },
  extrasMenu:[
    {"id":"ll_multi","name":"Lightning Lane Multi Pass (pp/day)","typicalPrice":35,"typicalQty":6,"suggest":"people_days","notes":"Qty idea: people × days."},
    {"id":"ll_single","name":"Lightning Lane Single Pass (pp/ride)","typicalPrice":20,"typicalQty":3,"suggest":"people","notes":"Qty idea: people × rides."},
    {"id":"memory_maker","name":"Memory Maker (trip)","typicalPrice":185,"typicalQty":1,"suggest":"one","notes":"Advance purchase saves vs day-of."},
    {"id":"dessert_adult","name":"Fireworks Dessert Party (adult)","typicalPrice":115,"typicalQty":2,"suggest":"adults","notes":"Adults attending."},
    {"id":"dessert_child","name":"Fireworks Dessert Party (child)","typicalPrice":59,"typicalQty":1,"suggest":"children","notes":"Children attending."},
    {"id":"savi","name":"Savi’s Lightsaber (each)","typicalPrice":274.99,"typicalQty":0,"suggest":"custom","notes":"Reserve early."},
    {"id":"droid","name":"Droid Depot (each)","typicalPrice":129,"typicalQty":0,"suggest":"custom","notes":"Reserve early."},
    {"id":"stroller","name":"Stroller Rental (per day)","typicalPrice":18,"typicalQty":5,"suggest":"days","notes":"Qty idea: days needed."},
    {"id":"character_meal","name":"Character Dining (per person)","typicalPrice":55,"typicalQty":3,"suggest":"people","notes":"Qty idea: people going."},
    {"id":"other","name":"Other custom extra","typicalPrice":0,"typicalQty":1,"suggest":"custom","notes":"Enter your own price."}
  ]
};
let state = { extras: [] };

/* -------- Config load & apply -------- */
async function loadConfig(){
  try{
    const res = await fetch("config.json",{cache:"no-store"});
    if(!res.ok) throw new Error("Config fetch failed");
    CONFIG = await res.json();
  }catch(e){
    CONFIG = JSON.parse(JSON.stringify(FALLBACK_CONFIG));
  }
  applyConfig(CONFIG);
  initEvents();
  activateTab("tickets");
  fillSummary();
}

function applyConfig(cfg){
  const d = cfg.defaults;

  // People
  setVal("adults", d.adults);
  setVal("children", d.children);
  setVal("nights", d.nights);
  document.getElementById("useSOG").checked = !!d.useSOG;

  // Tickets
  setVal("adultTicketPre", d.ticket.adultPre);
  setVal("childTicketPre", ""); // left blank; user can click "Use child estimate"
  setVal("ticketTaxPct", d.ticket.taxPct);
  setVal("sogDiscPct", d.ticket.sogDiscPct);
  setVal("childFallback", d.ticket.childFallback ? "1" : "0");

  // Room standard
  setVal("stdRoomPre", d.roomStandard.preTaxTotal);
  setVal("stdRoomTaxPct", d.roomStandard.roomTaxPct);
  setVal("stdResortNight", d.roomStandard.resortNight);
  setVal("stdResortTaxPct", d.roomStandard.resortTaxPct);
  setVal("stdParkingNight", d.roomStandard.parkingNightWithTax);

  // Room SOG
  setVal("sogNight", d.roomSOG.night);
  setVal("sogParkingNight", d.roomSOG.parkingNight);

  // Fly
  setVal("flyTrav", d.fly.travelers);
  setVal("flightPer", d.fly.pricePer);
  setVal("pitDays", d.fly.pitDays);
  setVal("pitGas", d.fly.pitGas);
  setVal("pitParkPer", d.fly.pitParkPer);
  setVal("busFare", d.fly.busFare);
  setVal("uberRT", d.fly.uberRoundTrip);
  setVal("airXfer", d.fly.transferMode);

  // Drive
  setVal("drvMiles", d.drive.milesRT);
  setVal("drvMPG", d.drive.mpg);
  setVal("drvGasPrice", d.drive.gasPrice);
  setVal("drvHotelNights", d.drive.hotelNights);
  setVal("drvHotelPer", d.drive.hotelPer);
  setVal("drvFoodPer", d.drive.roadFoodPerDay);
  setVal("drvDays", d.drive.roadDays);
  setVal("parkDriveDays", d.drive.parkDriveDays);
  setVal("parkParkingPer", d.drive.parkParkingPer);
  setVal("useHotelParking", d.drive.useHotelParking ? "1" : "0");
  setVal("moveHours", d.drive.movingHoursOneWay);
  setVal("hoursPerDay", d.drive.hoursPerDay);
  setVal("breakEvery", d.drive.breakEveryHours);
  setVal("breakMins", d.drive.breakMinutesEach);
  setVal("fuelStops", d.drive.fuelStopsRT);
  setVal("fuelStopMins", d.drive.fuelStopMinutesEach);

  // Stay
  setVal("stayFoodDays", d.stay.foodDays);
  setVal("stayFoodPer", d.stay.foodPerDay);
  setVal("souvenirBudget", d.stay.souvenirs);

  // Extras menu
  const sel = document.getElementById("extraMenu");
  sel.innerHTML = "";
  cfg.extrasMenu.forEach(item=>{
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.name;
    sel.appendChild(opt);
  });
  // Init extra controls from selected menu item
  onExtraMenuChange();
  // Hook: child estimate button uses config value
  document.getElementById("useChildEstimateBtn").onclick = ()=>{
    setVal("childTicketPre", d.ticket.childPreEstimated);
    fillSummary();
  };
}

/* -------- Core calculations -------- */
function readPeople(){
  return { adults: num("adults"), children: num("children"), nights: num("nights") };
}

function calcTickets(useSOGOverride=null){
  const {adults, children} = readPeople();
  const useSOG = (useSOGOverride===null) ? document.getElementById("useSOG").checked : !!useSOGOverride;

  const adultPre = num("adultTicketPre");
  const childPreRaw = num("childTicketPre");
  const fallback = document.getElementById("childFallback").value === "1";
  // If child price blank, prefer the config estimate, else adult price if fallback allowed
  const estChild = (CONFIG?.defaults?.ticket?.childPreEstimated ?? 0);
  const childPre = childPreRaw>0 ? childPreRaw : (estChild>0 ? estChild : (fallback ? adultPre : 0));

  const taxPct = num("ticketTaxPct")/100;
  const discPct = num("sogDiscPct")/100;

  const tax = useSOG ? 0 : taxPct;
  const disc = useSOG ? discPct : 0;

  const adultFinal = adultPre * (1 - disc) * (1 + tax);
  const childFinal = childPre * (1 - disc) * (1 + tax);

  const total = adultFinal*adults + childFinal*children;

  const lines = [];
  lines.push(`Adults × ${adults} at ${money(adultFinal)} = ${money(adultFinal*adults)}`);
  lines.push(`Children × ${children} at ${money(childFinal)} = ${money(childFinal*children)}`);
  lines.push(`Tax ${Math.round(tax*100)}%, SOG discount ${Math.round(disc*100)}%`);

  return { total, text: lines.join("<br>"), adultFinal, childFinal };
}

function calcRoom(driving=false, useSOGOverride=null){
  const { nights } = readPeople();
  const useSOG = (useSOGOverride===null) ? document.getElementById("useSOG").checked : !!useSOGOverride;

  if(useSOG){
    const night = num("sogNight");
    const parkNight = num("sogParkingNight");
    const parking = driving ? parkNight * nights : 0;
    const room = night * nights;
    const total = room + parking;
    const t = `Room ${nights} × ${money(night)} = ${money(room)}`
            + (driving ? `<br>Parking ${nights} × ${money(parkNight)} = ${money(parking)}` : "")
            + `<br><strong>Total room ${money(total)}</strong>`;
    return { total, text:t };
  } else {
    const pre = num("stdRoomPre");
    const rt = num("stdRoomTaxPct")/100;
    const resortNight = num("stdResortNight");
    const resortTax = num("stdResortTaxPct")/100;
    const parkNight = num("stdParkingNight");
    const room = pre * (1+rt);
    const resort = nights * resortNight * (1+resortTax);
    const parking = driving ? nights * parkNight : 0;
    const total = room + resort + parking;
    const t = `Room base ${money(pre)} with tax ${Math.round(rt*100)}% = ${money(room)}`
            + `<br>Resort fee ${nights} × ${money(resortNight)} with tax ${Math.round(resortTax*100)}% = ${money(resort)}`
            + (driving ? `<br>Parking ${nights} × ${money(parkNight)} = ${money(parking)}` : "")
            + `<br><strong>Total room ${money(total)}</strong>`;
    return { total, text:t };
  }
}

function calcFly(){
  const trav = num("flyTrav");
  const per = num("flightPer");
  const pitGas = num("pitGas");
  const pitDays = num("pitDays");
  const pitPer = num("pitParkPer");
  const xferMode = document.getElementById("airXfer").value;
  const busFare = num("busFare");
  const uberRT = num("uberRT");

  const flights = trav * per;
  const pit = pitGas + pitDays * pitPer;
  const xfer = (xferMode==="bus") ? trav * 2 * busFare : uberRT;

  const total = flights + pit + xfer;
  const lines = [];
  lines.push(`Flights ${trav} × ${money(per)} = ${money(flights)}`);
  lines.push(`PIT gas + parking = ${money(pit)}`);
  lines.push(xferMode==="bus"
    ? `LYNX ${trav} people × 2 rides × ${money(busFare)} = ${money(xfer)}`
    : `Uber round‑trip = ${money(xfer)}`);

  return { total, text: lines.join("<br>") };
}

/* -------- Extras (menu-driven) -------- */
function extrasConfigById(id){
  return (CONFIG?.extrasMenu || []).find(x=>x.id===id) || (FALLBACK_CONFIG.extrasMenu.find(x=>x.id===id));
}
function getPeople(){ const p = readPeople(); return p.adults + p.children; }
function getDays(){ return num("stayFoodDays") || readPeople().nights; }

function suggestQtyFor(extra){
  const people = getPeople();
  const days = getDays();
  switch(extra.suggest){
    case "people_days": return Math.max(0, people * days);
    case "people": return Math.max(0, people);
    case "adults": return Math.max(0, num("adults"));
    case "children": return Math.max(0, num("children"));
    case "days": return Math.max(0, days);
    case "nights": return Math.max(0, readPeople().nights);
    case "one": return 1;
    default: return extra.typicalQty ?? 0;
  }
}

function onExtraMenuChange(){
  const id = document.getElementById("extraMenu").value;
  const cfg = extrasConfigById(id);
  if(!cfg) return;
  setVal("extraPrice", cfg.typicalPrice ?? 0);
  setVal("extraQty", cfg.typicalQty ?? 1);
  const sg = suggestQtyFor(cfg);
  html("extraNote", `Typical price: ${money(cfg.typicalPrice||0)}. ${cfg.notes || ""} <br>Suggested qty right now: <strong>${sg}</strong>`);
}

function useSuggestedQty(){
  const id = document.getElementById("extraMenu").value;
  const cfg = extrasConfigById(id);
  if(!cfg) return;
  setVal("extraQty", suggestQtyFor(cfg));
  fillSummary();
}

function addExtra(){
  const id = document.getElementById("extraMenu").value;
  const name = (extrasConfigById(id)?.name) || "Custom extra";
  const price = num("extraPrice");
  const qty = num("extraQty");
  if(price<=0 || qty<=0) return;
  state.extras.push({name, price, qty});
  renderExtras();
  fillSummary();
}

function removeExtra(index){
  state.extras.splice(index,1);
  renderExtras();
  fillSummary();
}

function renderExtras(){
  const tbody = document.getElementById("extrasBody");
  const rows = state.extras.map((e,i)=>(
    `<tr>
       <td>${e.name}</td>
       <td class="tr">${e.qty}</td>
       <td class="tr">${money(e.price)}</td>
       <td class="tr">${money(e.price*e.qty)}</td>
       <td class="tr"><button class="btn btn-ghost" data-rm="${i}">✕</button></td>
     </tr>`
  ));
  tbody.innerHTML = rows.join("") || `<tr><td colspan="5">No extras added yet.</td></tr>`;
  document.querySelectorAll("[data-rm]").forEach(b=>{
    b.addEventListener("click", ()=> removeExtra(parseInt(b.dataset.rm,10)));
  });
  document.getElementById("extrasTotal").textContent = money(getExtrasOnlyTotal());
}

function getExtrasOnlyTotal(){
  return state.extras.reduce((sum,x)=> sum + (x.price * x.qty), 0);
}

function calcExtrasTotal(){
  // Extras (menu list) + souvenirs input
  return getExtrasOnlyTotal() + num("souvenirBudget");
}

function renderExtrasSummary(){
  const lines = state.extras.map(e => `${e.name}: ${e.qty} × ${money(e.price)} = ${money(e.price*e.qty)}`);
  const extras = getExtrasOnlyTotal();
  const sov = num("souvenirBudget");
  const total = extras + sov;
  return (lines.join("<br>") || "No extras added.")
    + `<br><strong>Extras subtotal:</strong> ${money(extras)}`
    + `<br><strong>Souvenirs:</strong> ${money(sov)}`
    + `<br><strong>Extras + souvenirs total:</strong> ${money(total)}`;
}

/* -------- Plans -------- */
function calcStayFood(){ return num("stayFoodPer") * num("stayFoodDays"); }

function calcDrive(useSOGOverride=null){
  const miles = num("drvMiles"), mpg = num("drvMPG"), gp = num("drvGasPrice");
  const hotelN = num("drvHotelNights"), hotelPer = num("drvHotelPer");
  const foodPer = num("drvFoodPer"), days = num("drvDays");
  const parkDriveDays = num("parkDriveDays"), parkPer = num("parkParkingPer");
  const useHotelParking = document.getElementById("useHotelParking").value === "1";

  const fuelCost  = (miles/mpg) * gp;
  const roadHotels = hotelN * hotelPer;
  const roadFood   = days * foodPer;
  const parkParking = parkDriveDays * parkPer;

  const room   = calcRoom(useHotelParking, useSOGOverride);
  const tickets= calcTickets(useSOGOverride);
  const stayFood = calcStayFood();
  const extras = calcExtrasTotal();

  const total = fuelCost + roadHotels + roadFood + room.total + tickets.total + stayFood + extras + parkParking;

  const lines = [];
  lines.push(`Fuel = ${money(fuelCost)}`);
  lines.push(`Highway hotels ${hotelN} × ${money(hotelPer)} = ${money(roadHotels)}`);
  lines.push(`Road meals ${days} × ${money(foodPer)} = ${money(roadFood)}`);
  lines.push(room.text);
  lines.push(`Tickets total ${money(tickets.total)}`);
  lines.push(`Food during stay ${money(stayFood)}`);
  if(parkParking>0) lines.push(`Theme‑park parking ${money(parkParking)}`);
  lines.push(`Extras & souvenirs ${money(extras)}`);

  return { total, text: lines.join("<br>") };
}

function calcFlyPlan(useSOGOverride=null){
  const room = calcRoom(false, useSOGOverride);
  const tickets = calcTickets(useSOGOverride);
  const fly = calcFly();
  const stayFood = calcStayFood();
  const extras = calcExtrasTotal();

  const total = room.total + tickets.total + fly.total + stayFood + extras;

  const lines = [];
  lines.push(fly.text);
  lines.push(room.text);
  lines.push(`Tickets total ${money(tickets.total)}`);
  lines.push(`Food during stay ${money(stayFood)}`);
  lines.push(`Extras & souvenirs ${money(extras)}`);

  return { total, text: lines.join("<br>") };
}

/* -------- Summary & comparison -------- */
function buildComparison(){
  const flyStd   = calcFlyPlan(false);
  const flySOG   = calcFlyPlan(true);
  const driveStd = calcDrive(false);
  const driveSOG = calcDrive(true);

  const matrix = [
    ["Fly (Standard)", flyStd.total],
    ["Fly (SOG)",      flySOG.total],
    ["Drive (Standard)", driveStd.total],
    ["Drive (SOG)",      driveSOG.total]
  ];
  const cheapest = matrix.reduce((a,b)=> b[1] < a[1] ? b : a, matrix[0]);

  let rows = `
    <table class="table">
      <thead><tr><th>Option</th><th>Total</th><th>Δ vs cheapest</th></tr></thead>
      <tbody>
  `;
  matrix.forEach(([label, val])=>{
    const delta = val - cheapest[1];
    const badge = (val===cheapest[1]) ? " (cheapest)" : "";
    rows += `<tr><td>${label}${badge}</td><td class="tr">${money(val)}</td><td class="tr">${delta===0?"—":money(delta)}</td></tr>`;
  });
  rows += "</tbody></table>";
  html("compareDetail", rows);
}

function fillSummary(){
  const tickets = calcTickets();
  const room    = calcRoom(false);
  const flyPlan = calcFlyPlan();
  const drive   = calcDrive();

  html("ticketsDetail", tickets.text + "<br><strong>Total " + money(tickets.total) + "</strong>");
  html("roomDetail", room.text);
  html("flyDetail", flyPlan.text);
  html("driveDetail", drive.text);
  html("extrasDetail", renderExtrasSummary());
  html("flyTotal", money(flyPlan.total));
  html("driveTotal", money(drive.total));

  buildComparison();
}

/* -------- Tabs, events, presets -------- */
function activateTab(name){
  document.querySelectorAll(".tab").forEach(s=>s.classList.remove("active"));
  document.getElementById(name).classList.add("active");
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  document.querySelector(`.tab-btn[data-tab="${name}"]`).classList.add("active");
}

function initEvents(){
  document.querySelectorAll(".tab-btn").forEach(b=>{
    b.addEventListener("click", ()=>activateTab(b.dataset.tab));
  });
  document.querySelectorAll(".calc").forEach(el=>{
    el.addEventListener("input", fillSummary);
    el.addEventListener("change", fillSummary);
  });

  // Presets
  document.getElementById("presetBase5").addEventListener("click", ()=>{ setVal("adultTicketPre",753.83); fillSummary(); });
  document.getElementById("presetHop5").addEventListener("click",  ()=>{ setVal("adultTicketPre",858.83); fillSummary(); });

  // Extras
  document.getElementById("extraMenu").addEventListener("change", onExtraMenuChange);
  document.getElementById("useSuggestedQty").addEventListener("click", useSuggestedQty);
  document.getElementById("addExtraBtn").addEventListener("click", addExtra);
  document.getElementById("clearExtras").addEventListener("click", ()=>{ state.extras=[]; renderExtras(); fillSummary(); });

  // Reset
  document.getElementById("resetBtn").addEventListener("click", ()=>location.reload());
}

/* -------- Boot -------- */
document.addEventListener("DOMContentLoaded", loadConfig);
