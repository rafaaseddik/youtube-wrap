const API_KEY = "AIzaSyDwSCuC0JJCvg5toeI5pDz0tSBgCTzkf9Q";
const GOOGLE_API_URL = "https://www.googleapis.com/youtube/v3/";
class YoutubeAPI{
    /**
     *
     * @param {string[]} videosIDs
     * @returns {Promise<[{
     *  id:string,
     *  channelTitle:string,
     *  channelURL:string,
     *  watchCount:number,
     *  thumbnailUrl:string
     * }]>}
     */
    static async getVideosMetadata(videosIDs){
        let result = await fetch(`${GOOGLE_API_URL}videos?id=${encodeURIComponent(videosIDs.join(','))}&part=snippet,statistics&key=${API_KEY}`);
        let resultJSON = await result.json()
        return resultJSON.items.map(videoItem=>{
            try{
                return {
                    id:videoItem.id,
                    channelTitle:videoItem.snippet.channelTitle,
                    channelURL:"https://youtube.com/channel/"+videoItem.snippet.channelId,
                    watchCount:videoItem.statistics.viewCount,
                    thumbnailUrl:this.thumbnailExtractor(videoItem.snippet.thumbnails)
                };
            }catch(e){
                console.error("error with video", videoItem, e)
            }

        })
    }
    static thumbnailExtractor(thumbnailsObject){
        if(thumbnailsObject.standard){
            return thumbnailsObject.standard.url
        }else if(thumbnailsObject.high){
            return thumbnailsObject.high.url
        }else if(thumbnailsObject.medium){
            return thumbnailsObject.medium.url;
        }else if(thumbnailsObject.default){
            return thumbnailsObject.default.url
        }else{
            return undefined;
        }
    }
    static getIdFromURL(url){
        return url.split('\u003d')[1];
    }
}

