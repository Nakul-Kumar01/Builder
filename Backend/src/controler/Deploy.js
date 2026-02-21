
const deployWebsite = async (req, res) => {
  try {
    const { html, css, js } = req.body;

    if (!html) {
      return res.status(400).json({ error: "No code provided" });
    }

    const files = [
      {
        file: "index.html",
        data: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Site</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  ${html}
  <script src="script.js"></script>
</body>
</html>
        `,
      },
      {
        file: "style.css",
        data: css || "",
      },
      {
        file: "script.js",
        data: js || "",
      },
    ];

    const response = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `website-${Date.now()}`,
        files,
        projectSettings: {
          framework: null,
          devCommand: null,
          buildCommand: null,
          outputDirectory: null,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data.error?.message || "Deployment failed",
      });
    }

    const deploymentUrl = `https://${data.name}.vercel.app`;

    res.json({ success: true, url: deploymentUrl });

  } catch (error) {
    console.error("Deployment Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { deployWebsite };