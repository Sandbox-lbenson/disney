function money(n){const v=Math.round((Number(n)+Number.EPSILON)*100)/100;return "$"+v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function num(id){const v=parseFloat(document.getElementById(id).value);return isNaN(v)?0:v}
function setVal(id,v){const el=document.getElementById(id);if(el)el.value=v}
function html(id,s){const el=document.getElementById(id);if(el)el.innerHTML=s}

let CONFIG=null
let state={extras:[]}

async function loadConfig(){
  try{
    const res=await fetch("config.json",{cache:"no-store"})
    if(!res.ok)throw new Error("config load failed")
    CONFIG=await res.json()
  }catch(e){
    alert("config.json did not load")
    return
  }
  applyConfig(CONFIG)
  initEvents()
  activateTab("tickets")
  fillSummary()
}

function applyConfig(cfg){
  const d=cfg.defaults
  setVal("adults",d.adults);setVal("children",d.children);setVal("nights",d.nights)
  document.getElementById("useSOG").checked=!!d.useSOG
  setVal("adultTicketPre",d.ticket.adultPre);setVal("childTicketPre",d.ticket.childPre)
  setVal("ticketTaxPct",d.ticket.taxPct);setVal("sogDiscPct",d.ticket.sogDiscPct)
  setVal("stdRoomPre",d.roomStandard.preTaxTotal);setVal("stdRoomTaxPct",d.roomStandard.roomTaxPct)
  setVal("stdResortNight",d.roomStandard.resortNight);setVal("stdResortTaxPct",d.roomStandard.resortTaxPct)
  setVal("stdParkingNight",d.roomStandard.parkingNightWithTax)
  setVal("sogNight",d.roomSOG.night);setVal("sogParkingNight",d.roomSOG.parkingNight)
  setVal("flyTrav",d.fly.travelers);setVal("flightPer",d.fly.pricePer);setVal("pitDays",d.fly.pitDays)
  setVal("pitGas",d.fly.pitGas);setVal("pitParkPer",d.fly.pitParkPer);setVal("busFare",d.fly.busFare)
  setVal("uberRT",d.fly.uberRoundTrip);setVal("airXfer",d.fly.transferMode)
  setVal("drvMiles",d.drive.milesRT);setVal("drvMPG",d.drive.mpg);setVal("drvGasPrice",d.drive.gasPrice)
  setVal("drvHotelNights",d.drive.hotelNights);setVal("drvHotelPer",d.drive.hotelPer)
  setVal("drvFoodPer",d.drive.roadFoodPerDay);setVal("drvDays",d.drive.roadDays)
  setVal("parkDriveDays",d.drive.parkDriveDays);setVal("parkParkingPer",d.drive.parkParkingPer)
  setVal("useHotelParking",d.drive.useHotelParking?"1":"0")
  setVal("moveHours",d.drive.movingHoursOneWay);setVal("hoursPerDay",d.drive.hoursPerDay)
  setVal("breakEvery",d.drive.breakEveryHours);setVal("breakMins",d.drive.breakMinutesEach)
  setVal("fuelStops",d.drive.fuelStopsRT);setVal("fuelStopMins",d.drive.fuelStopMinutesEach)
  setVal("stayFoodDays",d.stay.foodDays);setVal("stayFoodPer",d.stay.foodPerDay);setVal("souvenirBudget",d.stay.souvenirs)
  const sel=document.getElementById("extraMenu");sel.innerHTML=""
  cfg.extrasMenu.forEach(item=>{const o=document.createElement("option");o.value=item.id;o.textContent=item.name;sel.appendChild(o)})
  onExtraMenuChange()
}

function readPeople(){return{adults:num("adults"),children:num("children"),nights:num("nights")}}

function calcTickets(useSOGOverride=null){
  const p=readPeople()
  const useSOG=(useSOGOverride===null)?document.getElementById("useSOG").checked:!!useSOGOverride
  const adultPre=num("adultTicketPre")
  const childEl=document.getElementById("childTicketPre")
  const childPre=(childEl.value.trim()==="")?(CONFIG?.defaults?.ticket?.childPre||0):num("childTicketPre")
  const taxPct=num("ticketTaxPct")/100
  const discPct=num("sogDiscPct")/100
  const tax=useSOG?0:taxPct
  const disc=useSOG?discPct:0
  const adultFinal=adultPre*(1-disc)*(1+tax)
  const childFinal=childPre*(1-disc)*(1+tax)
  const total=adultFinal*p.adults+childFinal*p.children
  const lines=[]
  lines.push("Adults x "+p.adults+" at "+money(adultFinal)+" = "+money(adultFinal*p.adults))
  lines.push("Children x "+p.children+" at "+money(childFinal)+" = "+money(childFinal*p.children))
  lines.push("Tax "+Math.round(tax*100)+"%, SOG discount "+Math.round(disc*100)+"%")
  return{total,text:lines.join("<br>")}
}

function calcRoom(driving=false,useSOGOverride=null){
  const p=readPeople()
  const useSOG=(useSOGOverride===null)?document.getElementById("useSOG").checked:!!useSOGOverride
  if(useSOG){
    const night=num("sogNight"),parkNight=num("sogParkingNight")
    const parking=driving?parkNight*p.nights:0
    const room=night*p.nights
    const total=room+parking
    const t="Room "+p.nights+" x "+money(night)+" = "+money(room)+(driving?"<br>Parking "+p.nights+" x "+money(parkNight)+" = "+money(parking):"")+"<br>Total room "+money(total)
    return{total,text:t}
  }else{
    const pre=num("stdRoomPre"),rt=num("stdRoomTaxPct")/100,resNight=num("stdResortNight"),resTax=num("stdResortTaxPct")/100,parkNight=num("stdParkingNight")
    const room=pre*(1+rt)
    const resort=p.nights*resNight*(1+resTax)
    const parking=driving?p.nights*parkNight:0
    const total=room+resort+parking
    const t="Room base "+money(pre)+" with tax "+Math.round(rt*100)+"% = "+money(room)+"<br>Resort fee "+p.nights+" x "+money(resNight)+" with tax "+Math.round(resTax*100)+"% = "+money(resort)+(driving?"<br>Parking "+p.nights+" x "+money(parkNight)+" = "+money(parking):"")+"<br>Total room "+money(total)
    return{total,text:t}
  }
}

function calcFly(){
  const trav=num("flyTrav"),per=num("flightPer"),pitGas=num("pitGas"),pitDays=num("pitDays"),pitPer=num("pitParkPer")
  const mode=document.getElementById("airXfer").value, busFare=num("busFare"), uberRT=num("uberRT")
  const flights=trav*per
  const pit=pitGas+pitDays*pitPer
  const xfer=(mode==="bus")?trav*2*busFare:uberRT
  const total=flights+pit+xfer
  const lines=[]
  lines.push("Flights "+trav+" x "+money(per)+" = "+money(flights))
  lines.push("PIT gas and parking = "+money(pit))
  lines.push(mode==="bus"?"LYNX "+trav+" people x 2 rides x "+money(busFare)+" = "+money(xfer):"Uber round trip = "+money(xfer))
  return{total,text:lines.join("<br>")}
}

function extrasConfigById(id){return(CONFIG?.extrasMenu||[]).find(x=>x.id===id)}
function getPeopleCount(){const p=readPeople();return p.adults+p.children}
function getDays(){return num("stayFoodDays")||readPeople().nights}

function suggestQtyFor(extra){
  const people=getPeopleCount(),days=getDays(),p=readPeople()
  if(extra.suggest==="people_days")return Math.max(0,people*days)
  if(extra.suggest==="people")return Math.max(0,people)
  if(extra.suggest==="adults")return Math.max(0,num("adults"))
  if(extra.suggest==="children")return Math.max(0,num("children"))
  if(extra.suggest==="days")return Math.max(0,days)
  if(extra.suggest==="nights")return Math.max(0,p.nights)
  if(extra.suggest==="one")return 1
  return extra.typicalQty||0
}

function onExtraMenuChange(){
  const id=document.getElementById("extraMenu").value
  const cfg=extrasConfigById(id);if(!cfg)return
  setVal("extraPrice",cfg.typicalPrice||0)
  setVal("extraQty",cfg.typicalQty||1)
  const sg=suggestQtyFor(cfg)
  html("extraNote","Typical price "+money(cfg.typicalPrice||0)+(cfg.notes?". "+cfg.notes:"")+"<br>Suggested qty now "+sg)
}

function useSuggestedQty(){
  const id=document.getElementById("extraMenu").value
  const cfg=extrasConfigById(id);if(!cfg)return
  setVal("extraQty",suggestQtyFor(cfg))
  fillSummary()
}

function addExtra(){
  const id=document.getElementById("extraMenu").value
  const name=(extrasConfigById(id)?.name)||"Extra"
  const price=num("extraPrice"),qty=num("extraQty")
  if(price<=0||qty<=0)return
  state.extras.push({name,price,qty})
  renderExtras()
  fillSummary()
}

function removeExtra(index){
  state.extras.splice(index,1)
  renderExtras()
  fillSummary()
}

function renderExtras(){
  const tbody=document.getElementById("extrasBody")
  const rows=state.extras.map((e,i)=>`<tr><td>${e.name}</td><td class="tr">${e.qty}</td><td class="tr">${money(e.price)}</td><td class="tr">${money(e.price*e.qty)}</td><td class="tr"><button class="btn btn-ghost" data-rm="${i}">x</button></td></tr>`)
  tbody.innerHTML=rows.join("")||`<tr><td colspan="5">No extras added yet.</td></tr>`
  document.querySelectorAll("[data-rm]").forEach(b=>b.addEventListener("click",()=>removeExtra(parseInt(b.dataset.rm,10))))
  document.getElementById("extrasTotal").textContent=money(getExtrasOnlyTotal())
}

function getExtrasOnlyTotal(){return state.extras.reduce((s,x)=>s+x.price*x.qty,0)}
function calcExtrasTotal(){return getExtrasOnlyTotal()+num("souvenirBudget")}

function renderExtrasSummary(){
  const lines=state.extras.map(e=>`${e.name}: ${e.qty} x ${money(e.price)} = ${money(e.price*e.qty)}`)
  const extras=getExtrasOnlyTotal(),sov=num("souvenirBudget"),total=extras+sov
  return (lines.join("<br>")||"No extras added.")+"<br>Extras subtotal: "+money(extras)+"<br>Souvenirs: "+money(sov)+"<br>Extras plus souvenirs total: "+money(total)
}

function calcStayFood(){return num("stayFoodPer")*num("stayFoodDays")}

function calcDrive(useSOGOverride=null){
  const miles=num("drvMiles"),mpg=num("drvMPG"),gp=num("drvGasPrice")
  const hotelN=num("drvHotelNights"),hotelPer=num("drvHotelPer"),foodPer=num("drvFoodPer"),days=num("drvDays")
  const parkDays=num("parkDriveDays"),parkPer=num("parkParkingPer")
  const useHotelParking=document.getElementById("useHotelParking").value==="1"
  const fuel=(miles/mpg)*gp
  const roadHotels=hotelN*hotelPer
  const roadFood=days*foodPer
  const parkParking=parkDays*parkPer
  const room=calcRoom(useHotelParking,useSOGOverride)
  const tickets=calcTickets(useSOGOverride)
  const stayFood=calcStayFood()
  const extras=calcExtrasTotal()
  const total=fuel+roadHotels+roadFood+room.total+tickets.total+stayFood+extras+parkParking
  const lines=[]
  lines.push("Fuel "+money(fuel))
  lines.push("Highway hotels "+hotelN+" x "+money(hotelPer)+" = "+money(roadHotels))
  lines.push("Road meals "+days+" x "+money(foodPer)+" = "+money(roadFood))
  lines.push(room.text)
  lines.push("Tickets total "+money(tickets.total))
  lines.push("Food during stay "+money(stayFood))
  if(parkParking>0)lines.push("Theme park parking "+money(parkParking))
  lines.push("Extras and souvenirs "+money(extras))
  return{total,text:lines.join("<br>")}
}

function calcFlyPlan(useSOGOverride=null){
  const room=calcRoom(false,useSOGOverride)
  const tickets=calcTickets(useSOGOverride)
  const fly=calcFly()
  const stayFood=calcStayFood()
  const extras=calcExtrasTotal()
  const total=room.total+tickets.total+fly.total+stayFood+extras
  const lines=[]
  lines.push(fly.text)
  lines.push(room.text)
  lines.push("Tickets total "+money(tickets.total))
  lines.push("Food during stay "+money(stayFood))
  lines.push("Extras and souvenirs "+money(extras))
  return{total,text:lines.join("<br>")}
}

function buildComparison(){
  const flyStd=calcFlyPlan(false)
  const flySOG=calcFlyPlan(true)
  const driveStd=calcDrive(false)
  const driveSOG=calcDrive(true)
  const matrix=[["Fly Standard",flyStd.total],["Fly SOG",flySOG.total],["Drive Standard",driveStd.total],["Drive SOG",driveSOG.total]]
  const cheapest=matrix.reduce((a,b)=>b[1]<a[1]?b:a,matrix[0])
  let rows=`<table class="table"><thead><tr><th>Option</th><th>Total</th><th>Delta vs cheapest</th></tr></thead><tbody>`
  matrix.forEach(([label,val])=>{const delta=val-cheapest[1];const tag=(val===cheapest[1])?" (cheapest)":"";rows+=`<tr><td>${label}${tag}</td><td class="tr">${money(val)}</td><td class="tr">${delta===0?"—":money(delta)}</td></tr>`})
  rows+="</tbody></table>"
  html("compareDetail",rows)
}

function fillSummary(){
  const tickets=calcTickets()
  const room=calcRoom(false)
  const flyPlan=calcFlyPlan()
  const drive=calcDrive()
  html("ticketsDetail",tickets.text+"<br>Total "+money(tickets.total))
  html("roomDetail",room.text)
  html("flyDetail",flyPlan.text)
  html("driveDetail",drive.text)
  html("extrasDetail",renderExtrasSummary())
  html("flyTotal",money(flyPlan.total))
  html("driveTotal",money(drive.total))
  buildComparison()
}

function activateTab(name){
  document.querySelectorAll(".tab").forEach(s=>s.classList.remove("active"))
  document.getElementById(name).classList.add("active")
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"))
  document.querySelector(`.tab-btn[data-tab="${name}"]`).classList.add("active")
}

function initEvents(){
  document.querySelectorAll(".tab-btn").forEach(b=>b.addEventListener("click",()=>activateTab(b.dataset.tab)))
  document.querySelectorAll(".calc").forEach(el=>{el.addEventListener("input",fillSummary);el.addEventListener("change",fillSummary)})
  document.getElementById("presetBase5").addEventListener("click",()=>{setVal("adultTicketPre",753.83);fillSummary()})
  document.getElementById("presetHop5").addEventListener("click",()=>{setVal("adultTicketPre",858.83);fillSummary()})
  document.getElementById("extraMenu").addEventListener("change",onExtraMenuChange)
  document.getElementById("useSuggestedQty").addEventListener("click",useSuggestedQty)
  document.getElementById("addExtraBtn").addEventListener("click",addExtra)
  document.getElementById("clearExtras").addEventListener("click",()=>{state.extras=[];renderExtras();fillSummary()})
  document.getElementById("resetBtn").addEventListener("click",()=>location.reload())
}

document.addEventListener("DOMContentLoaded",loadConfig)
