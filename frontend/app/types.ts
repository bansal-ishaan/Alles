export interface Video {
    _id: string;
    title: string;
    thumbnail: {
        url: string;
    };
    ownerDetails: {
        
        // Add the _id field to the ownerDetails object.
        _id: string; 
        
        username: string;
        avatar?: { 
            url: string;
        };
    };
    views: number;
    createdAt: string;
    duration: number;
    //  other fields will come here, like description, etc.
}

export interface SubscribedChannel {
    subscribedChannel: {
        _id: string;
        username: string;
        fullName: string;
        avatar: { url: string };
        latestVideo?: {
            _id: string;
            videoFile: { url: string };
            thumbnail: { url: string };
            owner: string;
            title: string;
            description: string;
            duration: number;
            createdAt: string;
            views: number;
        };
    };
}

export interface ApiResponse<T> {
    statusCode: number;
    data: T;
    message: string;
    success: boolean;
}