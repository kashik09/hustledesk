import { useState } from "react";
import SubscriptionAutocomplete from "./SubscriptionAutocomplete";
import CurrencyPicker from "./CurrencyPicker";

export default function SubscriptionForm({ onSubmit }) {
  const [form, setForm] = useState({
    service_name: "",
    plan_name: "",
    amount: "",
    currency: "USD",
    country: "",
    category: ""
  });

  // when user selects a template
  const handleTemplateSelect = (template) => {
    setForm({
      service_name: template.service_name || "",
      plan_name: template.plan_name || "",
      amount: template.amount || "",
      currency: template.currency || "USD",
      country: template.country || "",
      category: template.category || ""
    });
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div style={{ maxWidth: "500px" }}>
      <h2>Add Subscription</h2>

      {/* TEMPLATE AUTOCOMPLETE (PERSON 5 FEATURE) */}
      <SubscriptionAutocomplete onSelect={handleTemplateSelect} />

      <form onSubmit={handleSubmit}>

        <input
          name="service_name"
          placeholder="Service Name"
          value={form.service_name}
          onChange={handleChange}
        />

        <input
          name="plan_name"
          placeholder="Plan Name"
          value={form.plan_name}
          onChange={handleChange}
        />

        <input
          name="amount"
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
        />

        {/* SHARED CURRENCY PICKER */}
        <CurrencyPicker
          value={form.currency}
          onChange={(value) =>
            setForm({ ...form, currency: value })
          }
        />

        <input
          name="country"
          placeholder="Country (KE, US, etc.)"
          value={form.country}
          onChange={handleChange}
        />

        <input
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
        />

        <button type="submit">
          Save Subscription
        </button>
      </form>
    </div>
  );
}