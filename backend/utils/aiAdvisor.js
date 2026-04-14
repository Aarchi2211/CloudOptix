const getAIAdvice = (alertType, resource) => {
  const suggestions = {
    "Idle Resource": `I've analyzed ${resource}. It has <10% usage. Recommendation: Terminate to save $120/mo.`,
    "High Cost Spike": `Warning! ${resource} cost jumped 150%. Check for memory leaks or unauthorized traffic.`,
    "Over-Provisioned": `The instance ${resource} is oversized. Downsizing to a 't3.micro' will maintain performance and cut costs by 40%.`
  };
  return suggestions[alertType] || "Optimize this resource to reduce your cloud bill.";
};

module.exports = { getAIAdvice };