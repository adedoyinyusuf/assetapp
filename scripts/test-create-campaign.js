// Test script to create a campaign via the API
async function testCreateCampaign() {
  const campaignData = {
    name: "Test Campaign - " + new Date().toISOString().slice(0, 19),
    description: "This is a test campaign created via script",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    assignedStates: [1], // Assuming state ID 1 exists
    assignedLgas: [], // Optional
    assignedCategories: [], // Optional
    budget: 100000,
    instructions: "Test instructions for the campaign"
  };

  try {
    console.log('Testing campaign creation...');
    console.log('Campaign data:', JSON.stringify(campaignData, null, 2));

    const response = await fetch('http://localhost:3000/api/stock-verification/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=your-session-token-here' // You'll need to get this from browser
      },
      body: JSON.stringify(campaignData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.text();
    console.log('Response body:', result);

    if (response.ok) {
      console.log('✅ Campaign created successfully!');
    } else {
      console.log('❌ Failed to create campaign');
    }

  } catch (error) {
    console.error('Error testing campaign creation:', error);
  }
}

// Run the test
testCreateCampaign();