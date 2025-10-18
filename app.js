function money(n){
  const v = Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  return "$" + v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
}
function num(id){
  const el = document.getElementById(id);
  const v = parseFloat(el.value);
  return isNaN(v) ? 0 : v;
}
function setVal(id,v){ document.getElementById(id).value = v; }
function html(id,s){ document.getElementById(id).innerHTML = s; }

function readPeople(){
  return { adults: num("adults"), children: num("children"), nights: num("nights") };
}

/* ---- Core calcs ---- */
function calcTickets(useSOGOverride=null){
  const {adults, children} = readPeople();
  const useSOG = (useSOGOverride===null) ? document.getElementById("useSOG").checked : !!useSOGOverride;

  const adultPre = num("adultTicketPre");
  const childPreRaw = num("childTicketPre");
  const fallback = document.getElementById("childFallback").value === "1";
  const childPre = childPreRaw>0 ? childPreRaw : (fallback ? adultPre : 0);

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

function calcExtrasTotal(){
  // Lightning Lane bundles
  const mp = num("llMultiPer"), mpd = num("llMultiDays"), mpp = num("llMultiPeople");
  const multi = mp * mpd * mpp;

  // Individual Lightning Lanes
  const sp = num("llSinglePer"), spc = num("llSingleCount"), spp = num("llSinglePeople");
  const single = sp * spc * spp;

  // Dessert party, allocate adults first then children
  const da = num("dessertAdult"), dc = num("dessertChild"), dq = num("dessertQty");
  const { adults, children } = readPeople();
  const dAdults = Math.min(dq, adults);
  const dChildren = Math.min(children, Math.max(0, dq - dAdults));
  const dessert = da * dAdults + dc * dChildren;

  // Builds & other
  const sav = num("saviPer") * num("saviQty");
  const dro = num("droidPer") * num("droidQty");
  const mm  = num("memoryMaker");
  const other = num("otherExtras");
  const sov = num("souvenirBudget");

  return multi + single + dessert + sav + dro + mm + other + sov;
}

function calcStayFood(){
  return num("stayFoodPer") * num("stayFoodDays");
}

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

/* ---- Summary & comparison ---- */
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
    rows += `<tr><td>${label}${badge}</td><td>${money(val)}</td><td>${delta===0?"—":money(delta)}</td></tr>`;
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
  html("extrasDetail", "Extras & souvenirs total " + money(calcExtrasTotal()));
  html("flyTotal", money(flyPlan.total));
  html("driveTotal", money(drive.total));

  buildComparison();
}

/* ---- Tabs, events, presets ---- */
function activateTab(name){
  document.querySelectorAll(".tab").forEach(s=>s.classList.remove("active"));
  document.getElementById(name).classList.add("active");
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  document.querySelector(`.tab-btn[data-tab="${name}"]`).classList.add("active");
}

function init(){
  document.querySelectorAll(".tab-btn").forEach(b=>{
    b.addEventListener("click", ()=>activateTab(b.dataset.tab));
  });

  document.querySelectorAll(".calc").forEach(el=>{
    el.addEventListener("input", fillSummary);
    el.addEventListener("change", fillSummary);
  });

  document.getElementById("presetBase5").addEventListener("click", ()=>{ setVal("adultTicketPre",753.83); fillSummary(); });
  document.getElementById("presetHop5").addEventListener("click", ()=>{ setVal("adultTicketPre",858.83); fillSummary(); });

  document.getElementById("resetBtn").addEventListener("click", ()=>location.reload());

  // Initial render
  activateTab("tickets");
  fillSummary();
}

document.addEventListener("DOMContentLoaded", init);
