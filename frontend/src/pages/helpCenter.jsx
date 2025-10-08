import React, { useState } from 'react';
import {
  Search, ChevronDown, ChevronUp, Book, MessageCircle, Mail, Phone,
  FileText, User, Leaf, Settings, HelpCircle, ExternalLink
} from 'lucide-react';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Book,
      color: 'emerald',
      faqs: [
        {
          question: 'How do I create an account?',
          answer:
            'To create an account, click the "Register" button on the homepage. Fill in your personal information, address details, and create a secure password. After submission, you can choose your role (Farmer or Consultant) to access specific features.'
        },
        {
          question: 'What are the different user roles?',
          answer:
            'Green Grow offers two user roles: Farmers (agricultural producers who can list their produce, access guidance, and connect with experts) and Consultants (agricultural advisors who can provide expert advice and assistance to farmers). Each role has tailored features to support their specific needs.'
        },
        {
          question: 'How do I complete my profile?',
          answer:
            'After registration, navigate to your profile settings. Upload a profile picture, verify your contact information, and add additional details relevant to your role. Complete profiles help build trust and enable role-specific features.'
        }
      ]
    },
    {
      id: 'account-management',
      title: 'Account Management',
      icon: User,
      color: 'green',
      faqs: [
        {
          question: 'How do I reset my password?',
          answer:
            'Click on "Forgot Password" on the login page. Enter your registered email address, and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.'
        },
        {
          question: 'Can I change my user role?',
          answer:
            'No, your role cannot be changed after registration. Each account is permanently assigned to its selected role (Farmer or Consultant) for data and access consistency.'
        },
        {
          question: 'How do I update my contact information?',
          answer:
            'Go to your Profile Settings, select "Edit Profile," and update your phone number, email, or address. Remember to save your changes before exiting.'
        }
      ]
    },
    {
      id: 'technical-support',
      title: 'Technical Support',
      icon: Settings,
      color: 'cyan',
      faqs: [
        {
          question: 'The website is loading slowly. What should I do?',
          answer:
            'Try clearing your browser cache, checking your internet connection, or using a different browser. If the problem persists, contact our technical support team.'
        },
        {
          question: "I'm having trouble uploading images.",
          answer:
            'Ensure your images are in JPG or PNG format and under 5MB in size. Try compressing large files before uploading. If issues continue, try using a different browser.'
        },
        {
          question: 'The app is not working on my mobile device.',
          answer:
            'Make sure you\'re using the latest version of your mobile browser. Clear your cache and cookies, then restart your device. For optimal experience, we recommend Chrome or Safari.'
        }
      ]
    },
    {
      id: 'sustainability',
      title: 'Sustainability & Practices',
      icon: Leaf,
      color: 'lime',
      faqs: [
        {
          question: 'How does Green Grow promote sustainable agriculture?',
          answer:
            'We connect farmers directly with consultants to promote sustainable farming practices. We encourage organic methods, provide expert advice, and support eco-friendly agricultural solutions.'
        },
        {
          question: 'Are consultants verified?',
          answer:
            'Yes, all consultants undergo verification before joining Green Grow. This ensures farmers receive reliable and professional agricultural advice.'
        },
        {
          question: 'How can I learn more about sustainable farming?',
          answer:
            'Visit our Resources section for articles, guides, and videos about sustainable agriculture. We regularly host webinars and workshops with agricultural experts.'
        }
      ]
    }
  ];

  const quickLinks = [
    { icon: MessageCircle, title: 'Live Chat', description: 'Chat with our support team', action: 'Start Chat' },
    { icon: Mail, title: 'Email Support', description: 'support@greengrow.com', action: 'Send Email' },
    { icon: Phone, title: 'Phone Support', description: '+94 11 234 5678', action: 'Call Now' },
    { icon: FileText, title: 'Documentation', description: 'Detailed guides and tutorials', action: 'View Docs' }
  ];

  const filteredCategories = categories
    .map(category => ({
      ...category,
      faqs: category.faqs.filter(
        faq =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(category => category.faqs.length > 0);

  const toggleCategory = categoryId => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const toggleFaq = faqIndex => {
    setExpandedFaq(expandedFaq === faqIndex ? null : faqIndex);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-12 h-12" />
            <h1 className="text-5xl font-bold">Help Center</h1>
          </div>
          <p className="text-xl text-emerald-50 mb-8">How can we help you today?</p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-600" />
              <input
                type="text"
                placeholder="Search for help articles, FAQs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-0 shadow-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-300"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Quick Links */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-emerald-800 mb-6">Quick Support Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-emerald-100 hover:border-emerald-300 group"
                >
                  <Icon className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-gray-800 mb-1">{link.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{link.description}</p>
                  <button className="text-emerald-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    {link.action} <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Categories */}
        <div>
          <h2 className="text-2xl font-bold text-emerald-800 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {(searchQuery ? filteredCategories : categories).map(category => {
              const Icon = category.icon;
              const isExpanded = expandedCategory === category.id;

              return (
                <div
                  key={category.id}
                  className="bg-white rounded-xl shadow-md border-2 border-emerald-100 overflow-hidden"
                >
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-6 hover:bg-emerald-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-${category.color}-100 flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 text-${category.color}-600`} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-semibold text-gray-800">{category.title}</h3>
                        <p className="text-sm text-gray-600">{category.faqs.length} articles</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-600" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-emerald-100 bg-emerald-50/30">
                      {category.faqs.map((faq, faqIndex) => {
                        const globalFaqIndex = `${category.id}-${faqIndex}`;
                        const isFaqExpanded = expandedFaq === globalFaqIndex;
                        return (
                          <div key={faqIndex} className="border-b border-emerald-100 last:border-b-0">
                            <button
                              onClick={() => toggleFaq(globalFaqIndex)}
                              className="w-full flex items-center justify-between p-5 hover:bg-white transition-colors text-left"
                            >
                              <span className="font-medium text-gray-800 pr-4">{faq.question}</span>
                              {isFaqExpanded ? (
                                <ChevronUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
                              )}
                            </button>
                            {isFaqExpanded && (
                              <div className="px-5 pb-5">
                                <p className="text-gray-700 leading-relaxed bg-white rounded-lg p-4 border-l-4 border-emerald-500">
                                  {faq.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {searchQuery && filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No results found</h3>
              <p className="text-gray-600">Try different keywords or browse our categories above</p>
            </div>
          )}
        </div>

        {/* Still Need Help Section */}
        <div className="mt-12 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Still need help?</h2>
          <p className="text-emerald-700 mb-6 text-lg">Our support team is here to assist you</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="bg-white text-emerald-600 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105">
              Contact Support
            </button>
            <button className="bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-800 transition-colors border-2 border-white/30 hover:border-white/50">
              Submit a Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
