export const SurveyForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState({
    purpose: '',
    foundInfo: '',
    helpfulness: '3',
    improvements: '',
    suggestion: '',
  });

  const handleChange = (e) => {
    setFeedback({ ...feedback, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Send to an endpoint, e.g., a Google Apps Script, Zapier webhook, or custom API
    await fetch('https://your-endpoint.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
    setSubmitted(true);
  };

  if (submitted) return <p>Thanks for your feedback! 🎉</p>;

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
      <h3>📋 Quick Feedback</h3>

      <label>
        What brought you here today?
        <input type="text" name="purpose" value={feedback.purpose} onChange={handleChange} required />
      </label>

      <label>
        Did you find what you were looking for?
        <textarea name="foundInfo" value={feedback.foundInfo} onChange={handleChange} />
      </label>

      <label>
        How helpful was this page?
        <select name="helpfulness" value={feedback.helpfulness} onChange={handleChange}>
          <option value="1">1 - Not helpful</option>
          <option value="2">2</option>
          <option value="3">3 - Neutral</option>
          <option value="4">4</option>
          <option value="5">5 - Very helpful</option>
        </select>
      </label>

      <label>
        Any part that could be improved?
        <textarea name="improvements" value={feedback.improvements} onChange={handleChange} />
      </label>

      <label>
        One thing you’d change about our docs?
        <textarea name="suggestion" value={feedback.suggestion} onChange={handleChange} />
      </label>

      <button type="submit">Submit</button>
    </form>
  );
};
