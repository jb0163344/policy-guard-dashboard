"use client";

export default function Page() {
  const test = async () => {
    console.log("BUTTON CLICKED");

    const res = await fetch("/api/risk", {
      method: "POST",
    });

    console.log(await res.json());
  };

  return (
    <button onClick={test}>
      Test API
    </button>
  );
}
