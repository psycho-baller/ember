import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Ember',
  description: 'Read our Terms of Service to understand your rights and responsibilities when using our platform.',
};

const TermsPage = () => {
  return (
    <div>
    <p>Ember's Terms of Service summarize how you can sign up with your university email, interact via chat to build a personalized profile, opt into profile sharing and group chats, and trust that your data is used responsibly under Alberta law. These Terms define key concepts like “Service” and “Connection Profile,” outline age requirements and user expectations, explain how we process your data with third-party AI providers, and set out liability limits and contact details. </p>

  <h2>Definitions</h2>
  <ul>
    <li><strong>“Service”</strong> means Ember, the AI superconnector accessible at heyember.vercel.app. </li>
    <li><strong>“User”</strong> means any individual who registers with a valid US or Canadian university email and interacts with Ember via chat. </li>
    <li><strong>“Connection Profile”</strong> means the information collected during your conversation with Ember, including interests, academic details, and match preferences. </li>
    <li><strong>“Match”</strong> means another User whose Connection Profile aligns with yours and who has mutually opted in to receive introductions. </li>
  </ul>

  <h2>Eligibility</h2>
  <p>You must be at least 18 years of age to use the Service. </p>
  <p>By using the Service, you represent and warrant that you meet this age requirement. </p>

  <h2>Registration and Account Activation</h2>
  <p>To register, you provide a valid US or Canadian university email on heyember.vercel.app. </p>
  <p>Your account is activated once you complete the initial chat session with Ember to establish your Connection Profile. </p>

  <h2>Profile Creation and Matching</h2>
  <p>Ember learns about your interests and goals through chat interactions. </p>
  <p>Based on these conversations, Ember builds your Connection Profile to capture who you are and who you want to meet. </p>
  <p>Ember then searches for compatible matches on campus using your Connection Profile. </p>

  <h2>Profile Sharing and Group Chat</h2>
  <p>When Ember finds a potential Match, it only shares your Profile Information if both you and the other User explicitly approve. </p>
  <p>Once approval is given by both parties, Ember sets up a group chat to facilitate introductions. </p>

  <h2>User Conduct</h2>
  <p>Users must maintain respectful and appropriate behavior when interacting with Ember and other Users. </p>
  <p>Inappropriate conduct—including harassment, hate speech, or attempts to misuse the system—may result in suspension or removal. </p>

  <h2>AI Processing and Data Usage</h2>
  <p>Ember uses industry-leading third-party AI providers (e.g., OpenAI) to process your chat interactions and build your Connection Profile. </p>
  <p>Your conversation data and profile details may be stored securely to improve matching accuracy and Service quality. </p>

  <h2>Intellectual Property</h2>
  <p>All content, features, and functionality of the Service are the exclusive property of Ember or its licensors. </p>

  <h2>Limitation of Liability</h2>
  <p>The Service is provided on an “AS IS” and “AS AVAILABLE” basis without warranties of any kind. </p>
  <p>Ember is not liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. </p>

  <h2>Governing Law</h2>
  <p>These Terms are governed by the laws of the Province of Alberta and the federal laws of Canada applicable therein.</p>

  <h2>Changes to Terms</h2>
  <p>We may update these Terms from time to time. Material changes will be communicated via email to your registered address or posted on the Service. Continued use after notification constitutes acceptance of the revised Terms.</p>

  <h2>Contact Information</h2>
  <p>For questions about these Terms, please contact us at <a href="mailto:ramim66809@gmail.com">ramim66809@gmail.com</a>.</p>

    </div>
  );
};

export default TermsPage;
