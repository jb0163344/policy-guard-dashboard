const res = await fetch("/api/risk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    identity_id: "test-user",
    failedLogins: 6,
    locationChange: true,
    deviceUnknown: false,
    impossibleTravel: false
  })
});

const data = await res.json();
alert(data.riskScore);
