/**
 * Test Email Configuration
 * Run this script to verify your Hostinger email settings are working
 * Usage: node test-email.js [recipient-email]
 */

const nodemailer = require('nodemailer');

// Email configuration - Update these with your settings
const config = {
  host: 'smtp.hostinger.com',
  port: 465,
  user: 'info@flipychat.com',
  password: 'Mohit9313#123',
  from: '"FlipyChat" <info@flipychat.com>',
};

console.log('\n🧪 Testing Hostinger Email Configuration\n');
console.log('='.repeat(60));
console.log('\n📧 Email Settings:');
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port} (SSL)`);
console.log(`   User: ${config.user}`);
console.log(`   Password: ${config.password ? '***' + config.password.slice(-4) : 'NOT SET'}`);
console.log(`   From: ${config.from}`);
console.log('\n' + '='.repeat(60));

// Get recipient email from command line or use sender email
const recipientEmail = process.argv[2] || config.user;

if (!config.password || config.password === 'your-password-here') {
  console.error('\n❌ Error: Email password not configured!');
  console.error('   Please update the password in this script.');
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.host,
  port: config.port,
  secure: true, // true for port 465
  auth: {
    user: config.user,
    pass: config.password,
  },
  tls: {
    rejectUnauthorized: false,
  },
  debug: true, // Enable debug output
  logger: true, // Log to console
});

async function testEmail() {
  try {
    // Step 1: Verify SMTP connection
    console.log('\n🔍 Step 1: Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    console.log('   ➜ Server is ready to send emails');

    // Step 2: Send test email
    console.log('\n📨 Step 2: Sending test email...');
    console.log(`   Recipient: ${recipientEmail}`);
    
    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    const mailOptions = {
      from: config.from,
      to: recipientEmail,
      subject: '✅ FlipyChat Email Test - Configuration Successful!',
      text: `Your test OTP is: ${testOTP}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">✅ Email Test Successful!</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">FlipyChat Email Configuration</h2>
                      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                        Great news! Your Hostinger email configuration is working correctly. 
                        Your production email system is ready to send verification emails.
                      </p>
                      
                      <!-- Test OTP Box -->
                      <div style="background-color: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                        <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Test OTP</p>
                        <p style="margin: 0; color: #667eea; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${testOTP}
                        </p>
                      </div>
                      
                      <!-- Configuration Details -->
                      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">Configuration Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>SMTP Host:</strong></td>
                            <td style="padding: 8px 0; color: #333333; font-size: 14px;">${config.host}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Port:</strong></td>
                            <td style="padding: 8px 0; color: #333333; font-size: 14px;">${config.port} (SSL)</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>From:</strong></td>
                            <td style="padding: 8px 0; color: #333333; font-size: 14px;">${config.user}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Status:</strong></td>
                            <td style="padding: 8px 0; color: #22c55e; font-size: 14px;"><strong>✅ Working</strong></td>
                          </tr>
                        </table>
                      </div>
                      
                      <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                        This is an automated test email. You can now use these settings in production.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #eeeeee;">
                      <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                        © ${new Date().getFullYear()} FlipyChat. All rights reserved.
                      </p>
                      <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px; text-align: center;">
                        Sent from: ${config.host}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('\n✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    if (info.response) {
      console.log('   Server Response:', info.response);
    }
    if (info.accepted && info.accepted.length > 0) {
      console.log('   Accepted:', info.accepted.join(', '));
    }
    if (info.rejected && info.rejected.length > 0) {
      console.log('   Rejected:', info.rejected.join(', '));
    }
    
    console.log('\n📬 Check your inbox:');
    console.log(`   Email: ${recipientEmail}`);
    console.log(`   Subject: "✅ FlipyChat Email Test - Configuration Successful!"`);
    console.log(`   Test OTP: ${testOTP}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ All tests passed! Your email configuration is correct.');
    console.log('='.repeat(60) + '\n');
    
    console.log('💡 Next steps:');
    console.log('   1. Check the email arrived in your inbox');
    console.log('   2. If not in inbox, check spam/junk folder');
    console.log('   3. Your .env.production is correctly configured!');
    console.log('   4. Deploy and restart your production server\n');
    
  } catch (error) {
    console.error('\n❌ Email test failed!\n');
    console.error('Error Details:');
    console.error('  Message:', error.message);
    
    if (error.code) {
      console.error('  Code:', error.code);
      
      // Provide specific troubleshooting based on error code
      switch (error.code) {
        case 'EAUTH':
          console.error('\n💡 Authentication failed. Possible causes:');
          console.error('   1. Incorrect email or password');
          console.error('   2. Email account not active in Hostinger');
          console.error('   3. Check Hostinger email panel: https://hpanel.hostinger.com');
          break;
        case 'ECONNECTION':
        case 'ETIMEDOUT':
          console.error('\n💡 Connection failed. Possible causes:');
          console.error('   1. Firewall blocking port 465');
          console.error('   2. Internet connection issue');
          console.error('   3. SMTP server temporarily down');
          break;
        case 'ENOTFOUND':
          console.error('\n💡 Server not found. Possible causes:');
          console.error('   1. Check SMTP host is correct: smtp.hostinger.com');
          console.error('   2. DNS resolution issue');
          break;
        default:
          console.error('\n💡 Troubleshooting:');
          console.error('   1. Verify email credentials in Hostinger panel');
          console.error('   2. Check port 465 is not blocked');
          console.error('   3. Try port 587 with STARTTLS instead');
      }
    }
    
    if (error.response) {
      console.error('  Response:', error.response);
    }
    
    if (error.responseCode) {
      console.error('  Response Code:', error.responseCode);
    }
    
    console.error('\n' + '='.repeat(60));
    console.error('❌ Email configuration needs to be fixed');
    console.error('='.repeat(60) + '\n');
    
    process.exit(1);
  }
}

// Run the test
testEmail();

