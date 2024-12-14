const uploadBtn = document.getElementById("upload-btn");
const uploadInput = document.getElementById("upload-input");
const viewModal = new bootstrap.Modal(document.getElementById('view-modal'))
const viewModalBtn = document.querySelectorAll('.play-btn');
const viewModalIFrame = document.getElementById('video-frame');
const loading = document.getElementById('loader');
const content = document.getElementById('content');
const REMOVED_VIDEO_TITLES = ["Watched a video that has been removed", "Visited YouTube Music"];

/**
 * @description
 * This function initializes the application by creating event listeners
 * @returns {Promise<void>}
 */
async function main() {
    uploadBtn.addEventListener("click", handleUploadClick);
    uploadInput.addEventListener("change", (e) => handleSelectFile(e));
    console.log(viewModalBtn)
    viewModalBtn.forEach(elt => elt.addEventListener('click', openModal))

}

/**
 *
 * @description
 * This function is the event handler for upload button click
 * @param _event
 * @returns {Promise<void>}
 */
async function handleUploadClick(_event) {
    uploadInput.click();
}

/**
 * @description
 * This function handles the selection of a new JSON data file.
 * @param event
 * @returns {Promise<void>}
 */
async function handleSelectFile(event) {
    console.log(event)
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0]);
    fileReader.onload = (e) => {
        processData(JSON.parse(e.target.result))
    }
}

/**
 * @description
 * This function processes the JSON data
 * @param data
 * @returns {Promise<void>}
 */
async function processData(data) {
    loading.classList.remove('d-none');
    content.classList.add('d-none');
    let videosMap = new Map();
    let channelsMap = new Map();
    // Processing videos list
    data.forEach(video => {
        const title = video.title;
        if (!REMOVED_VIDEO_TITLES.includes(title) && new Date(video.time).getUTCFullYear() === 2024) {
            const id = YoutubeAPI.getIdFromURL(video.titleUrl);
            if (videosMap.has(id)) {
                const videoObj = videosMap.get(id);
                videoObj.viewsCount++;
                videoObj.logs.push(video)
            } else {
                try {
                    videosMap.set(id, {
                        title: title.replace(/^Watched /, ''),
                        viewsCount: 1,
                        id: id,
                        url: video.titleUrl,
                        logs: [video]
                    })
                } catch (e) {
                    console.error(e, video)
                }
            }
        }
    });

    //
    // Sorting
    const sortedVideosList = Array.from(videosMap.values()).sort((v1, v2) => v2.viewsCount - v1.viewsCount)
    console.log(videosMap)
    console.log(sortedVideosList);
    //console.table(sortedVideosList);
    let topFiveHundred = sortedVideosList.slice(0, 500);
    const topFiveHundredSeparated = [
        sortedVideosList.slice(0, 50),
        sortedVideosList.slice(50, 100),
        sortedVideosList.slice(100, 150),
        sortedVideosList.slice(150, 200),
        sortedVideosList.slice(200, 250),
        sortedVideosList.slice(250, 300),
        sortedVideosList.slice(300, 350),
        sortedVideosList.slice(350, 400),
        sortedVideosList.slice(400, 450),
        sortedVideosList.slice(450, 500)
    ];
    const topFiveHundredProcessed = await Promise.all(topFiveHundredSeparated.map(list => YoutubeAPI.getVideosMetadata(list.map(video => video.id))));
    const topFiveHundredProcessedMerged = [
        ...topFiveHundredProcessed[0],
        ...topFiveHundredProcessed[1],
        ...topFiveHundredProcessed[2],
        ...topFiveHundredProcessed[3],
        ...topFiveHundredProcessed[4],
        ...topFiveHundredProcessed[5],
        ...topFiveHundredProcessed[6],
        ...topFiveHundredProcessed[7],
        ...topFiveHundredProcessed[8],
        ...topFiveHundredProcessed[9],
    ];
    topFiveHundredProcessedMerged.forEach((videoStats, index) => {
        videosMap.get(videoStats.id).fromYoutubeAPI = videoStats;
    })
    topFiveHundred = topFiveHundred.filter(e => e.fromYoutubeAPI !== undefined)

    topFiveHundred.forEach(video => {
        try {
            const channel = video.fromYoutubeAPI.channelTitle;
            if (channelsMap.has(channel)) {
                const channelObj = channelsMap.get(channel);
                channelObj.viewsCount += video.viewsCount;
                channelObj.videos.push(video)
            } else {

                channelsMap.set(channel, {
                    channelTitle: channel,
                    viewsCount: video.viewsCount,
                    url: video.fromYoutubeAPI.channelURL,
                    videos: [video]
                })

            }
        } catch (e) {
            console.error(e, video)
        }

    });
    console.log(channelsMap)

    // TOP FIVE
    topFiveHundred.slice(0, 5).forEach((video, index) => {
        updateVideoCard('top-' + (index + 1), video)
    })
    // TOP 500 VIDEOS
    topFiveHundred.slice(0,100).forEach((video, index) => {
        document.getElementById('top-500-videos').innerHTML += `
        <tr>
                        <th scope="row">${index + 1}</th>
                        <td><a href="${video.url}" target="_blank">${video.title}</a></td>
                        <td>${video.viewsCount}</td>
                        <td>${video.fromYoutubeAPI.channelTitle}</td>
                    </tr>`
    })
    // TOP 100 CHANNELS
    const sortedChannelsList = Array.from(channelsMap.values()).sort((c1, c2) => c2.viewsCount - c1.viewsCount);
    console.log(sortedChannelsList)
    sortedChannelsList.slice(0, 20).forEach((channel, index) => {
        document.getElementById('top-500-channels').innerHTML += `
        <tr>
            <th scope="row">${index + 1}</th>
            <td><a href="${channel.url}" target="_blank">${channel.channelTitle}</a></td>
            <td>${channel.videos.length}</td>
            <td>${channel.viewsCount}</td>
            <td>
                <p>
                  <a class="btn btn-primary" data-bs-toggle="collapse" href="#channel-${index}" role="button" aria-expanded="false" aria-controls="collapseExample">
                    View videos list
                  </a>
                </p>
                <div class="collapse" id="channel-${index}">
                  <div class="card card-body">
                    ${channel.videos.map(video=>video.title).join('<br>')}
                  </div>
                </div>
            </td>
        </tr>`
    })
    loading.classList.add('d-none');
    content.classList.remove('d-none');
}

function updateVideoCard(cardID, videoData) {
    const card = document.getElementById(cardID);
    card.querySelector(".video-title").innerHTML = videoData.title;
    card.querySelector(".channel-name").innerHTML = videoData.fromYoutubeAPI.channelTitle;
    card.querySelector(".views-number").innerHTML = videoData.viewsCount;
    card.querySelector(".play-btn").setAttribute("videoID", videoData.id);
    card.querySelector(".video-img").setAttribute("src", videoData.fromYoutubeAPI.thumbnailUrl);
    card.querySelector(".channel-name").setAttribute("href", videoData.fromYoutubeAPI.channelURL);

}

function openModal(event) {
    console.log(event.target)
    viewModalIFrame.setAttribute("src", "https://www.youtube.com/embed/" + event.target.getAttribute("videoID"))
    viewModal.toggle();
}

main()
    .then((done) => {
        console.debug("App initialization completed with success");
    })
    .catch((error) => {
        console.error("Fatal error :", error);
    });
