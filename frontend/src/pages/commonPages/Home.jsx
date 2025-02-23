import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent } from '@/components/ui/card';
import {
    Shield,
    Users,
    Mail,
    Key,
    Brain,
    UserCheck,
    Layout,
    MousePointer,
    Smartphone,
    UserCog
} from 'lucide-react';

const Home = () => {
    const user = useSelector(state => state.auth.userData);

    const systemFeatures = [
        {
            icon: <UserCog className="w-8 h-8 text-blue-600" />,
            title: "Role Management",
            description: "Advanced user and admin role management system with granular permissions control."
        },
        {
            icon: <Brain className="w-8 h-8 text-purple-600" />,
            title: "AI Content Moderation",
            description: "Intelligent AI-powered system for detecting and filtering inappropriate content."
        },
        {
            icon: <Shield className="w-8 h-8 text-green-600" />,
            title: "Enhanced Security",
            description: "OAuth authentication, domain validation for college emails, and admin approval system."
        },
        {
            icon: <Mail className="w-8 h-8 text-red-600" />,
            title: "Email Notifications",
            description: "Automated email updates for students using Nodemailer integration."
        },
        {
            icon: <Key className="w-8 h-8 text-yellow-600" />,
            title: "Session Management",
            description: "Secure JWT token-based session management for enhanced security."
        }
    ];

    const userExperience = [
        {
            icon: <Layout className="w-8 h-8 text-indigo-600" />,
            title: "User Friendly Interface",
            description: "Clean and intuitive design that makes navigation effortless."
        },
        {
            icon: <MousePointer className="w-8 h-8 text-pink-600" />,
            title: "Interactive Experience",
            description: "Engaging interface with real-time updates and smooth interactions."
        },
        {
            icon: <Smartphone className="w-8 h-8 text-cyan-600" />,
            title: "Responsive Design",
            description: "Seamlessly adapts to all devices and screen sizes."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 w-full">
            {/* Hero Section with Profile */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 w-full">
                <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
                    <div className="md:w-2/3">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Welcome{user ? `, ${user.name}` : ' to Our College Portal'}
                        </h1>
                        <p className="text-xl opacity-90 max-w-2xl mb-6">
                            Your comprehensive digital solution for streamlined college administration and enhanced academic experience.
                        </p>
                    </div>
                    {user && (
                        <div className="md:w-1/3 flex justify-center">
                            <div className="relative">
                                {user.profilePic ? (
                                    <img
                                        src={user.profilePic}
                                        alt="Profile"
                                        className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-blue-400 flex items-center justify-center border-4 border-white shadow-lg">
                                        <span className="text-4xl text-white">
                                            {user.name?.charAt(0)?.toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute -bottom-2 right-0 bg-green-500 w-6 h-6 rounded-full border-2 border-white"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* System Features */}
            <div className="w-full bg-white py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
                        Advanced System Features
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {systemFeatures.map((feature, index) => (
                            <Card key={index} className="hover:shadow-lg transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="mb-4">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 text-gray-800">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Experience Features */}
            <div className="w-full bg-gray-50 py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
                        User Experience
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {userExperience.map((feature, index) => (
                            <Card key={index} className="hover:shadow-lg transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="mb-4">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 text-gray-800">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Security Badge */}
            <div className="w-full bg-white py-16">
                <div className="container mx-auto px-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <Shield className="w-16 h-16 text-blue-600 hidden md:block" />
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                    Enterprise-Grade Security
                                </h3>
                                <p className="text-gray-600 max-w-2xl">
                                    Our platform implements multiple layers of security including OAuth authentication,
                                    domain validation, admin approval system, and JWT token-based session management
                                    to ensure your data remains secure and protected.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;