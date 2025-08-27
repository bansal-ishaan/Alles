// app/components/TagsBar.tsx

'use client'; // This needs to be a client component to use hooks

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

const TagButton = ({ label, isActive }: { label: string, isActive: boolean }) => {
    return (
        <button className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${isActive ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}>
            {label}
        </button>
    );
};

export default function TagsBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Get the current active query and sort parameters from the URL
    const currentQuery = searchParams.get('query') || 'All';
    const currentSort = searchParams.get('sortBy');

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            // If the value is 'All', we remove the query param
            if (value === 'All') {
                params.delete(name);
            } else {
                params.set(name, value);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleFilter = (paramName: string, value: string) => {
        router.push(pathname + '?' + createQueryString(paramName, value));
    };

    const categories = ['All', 'Gaming', 'Music', 'Memes', 'Education'];
    const sortOptions = [
        { label: 'Latest', value: 'createdAt' },
        { label: 'Most Views', value: 'views' },
        { label: 'Most Likes', value: 'likes' }, // Assuming you have a likesCount field
    ];

    return (
        <div className="top-[57px] bg-[#0F0F0F] z-40 py-2  center">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 px-4 md:px-6 no-scrollbar">
                {categories.map(category => (
                    <div key={category} onClick={() => handleFilter('query', category)}>
                        <TagButton label={category} isActive={currentQuery === category} />
                    </div>
                ))}
                
                <div className="border-l border-gray-700 h-6 mx-2"></div>
                
                {sortOptions.map(option => (
                     <div key={option.value} onClick={() => handleFilter('sortBy', option.value)}>
                        <TagButton label={option.label} isActive={currentSort === option.value} />
                    </div>
                ))}
            </div>
        </div>
    );
}

