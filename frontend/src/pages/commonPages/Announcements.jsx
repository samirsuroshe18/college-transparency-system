import React, { useState } from 'react';
import {
    Megaphone,
    Calendar,
    Tag,
    ChevronDown,
    ChevronUp,
    Search,
    Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Announcements = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedAnnouncement, setExpandedAnnouncement] = useState(null);

    // Sample data - replace with your API data
    const announcements = [
        {
            id: 1,
            title: "End Semester Examination Schedule Released",
            content: "The examination schedule for the upcoming end semester has been finalized. Please check the detailed timetable on the examination portal. All students are required to verify their hall tickets and report any discrepancies to their respective department coordinators.",
            category: "Academic",
            date: "2024-02-23",
            priority: "high",
            department: "Examination Cell"
        },
        {
            id: 2,
            title: "Annual Technical Symposium - TechVista 2024",
            content: "We are excited to announce our annual technical symposium TechVista 2024. The event will feature keynote speakers from leading tech companies, workshops, and competitive events. Early bird registration starts next week.",
            category: "Event",
            date: "2024-02-22",
            priority: "medium",
            department: "Technical Committee"
        },
        {
            id: 3,
            title: "Library Working Hours Extended",
            content: "In response to student requests, the central library will now remain open until 10 PM on weekdays. This extended timing will be implemented starting next week to support students during the examination preparation period.",
            category: "Facility",
            date: "2024-02-21",
            priority: "low",
            department: "Library"
        }
    ];

    const categories = [
        { id: 'all', label: 'All Announcements' },
        { id: 'Academic', label: 'Academic' },
        { id: 'Event', label: 'Events' },
        { id: 'Facility', label: 'Facility' }
    ];

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredAnnouncements = announcements
        .filter(announcement =>
            (selectedCategory === 'all' || announcement.category === selectedCategory) &&
            (announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                announcement.content.toLowerCase().includes(searchTerm.toLowerCase()))
        );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center mb-4">
                    <Megaphone className="w-8 h-8 text-blue-600 mr-3" />
                    <h1 className="text-3xl font-bold text-gray-800">Announcements</h1>
                </div>
                <p className="text-gray-600">
                    Stay updated with the latest announcements from your institution
                </p>
            </div>

            {/* Search and Filter Section */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search announcements..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                    <Filter className="w-5 h-5 text-gray-500" />
                    {categories.map(category => (
                        <button
                            key={category.id}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap ${selectedCategory === category.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                            onClick={() => setSelectedCategory(category.id)}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Announcements List */}
            <div className="space-y-4">
                {filteredAnnouncements.map(announcement => (
                    <Card
                        key={announcement.id}
                        className="hover:shadow-md transition-shadow"
                    >
                        <CardContent className="p-6">
                            <div className="flex flex-col space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                            {announcement.title}
                                        </h2>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {new Date(announcement.date).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center">
                                                <Tag className="w-4 h-4 mr-1" />
                                                {announcement.department}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                                        {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)} Priority
                                    </span>
                                </div>

                                <div className={`text-gray-600 ${expandedAnnouncement === announcement.id ? '' : 'line-clamp-2'
                                    }`}>
                                    {announcement.content}
                                </div>

                                <button
                                    className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                    onClick={() => setExpandedAnnouncement(
                                        expandedAnnouncement === announcement.id ? null : announcement.id
                                    )}
                                >
                                    {expandedAnnouncement === announcement.id ? (
                                        <>
                                            <ChevronUp className="w-4 h-4 mr-1" />
                                            Show Less
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-4 h-4 mr-1" />
                                            Read More
                                        </>
                                    )}
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredAnnouncements.length === 0 && (
                <div className="text-center py-12">
                    <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600">No announcements found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
            )}
        </div>
    );
};

export default Announcements;