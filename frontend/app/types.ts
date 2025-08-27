
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