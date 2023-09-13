
import dicomParser from 'dicom-parser';
import { HOST_ORTHANC, PORT_ORTHANC, PROTOCOL_ORTHANC } from '../constants/global';

// convert to dataURI -> Blob
export const dataURItoBlob = dataURI => {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    var bb = new Blob([ab], { "type": mimeString });
    return bb;
}

// objectUID -> Dicom Metadata
export const objectUIDtoDicomMetadata = async objectUID => {
    const url = `${PROTOCOL_ORTHANC}://${HOST_ORTHANC}:${PORT_ORTHANC}/orthanc/wado?requestType=WADO&contentType=application/dicom&transferSyntax=*&objectUID=${objectUID}`;
    const headers = new Headers();
    headers.append('Authorization', 'Basic ' + btoa('orthanc' + ':' + 'orthanc'));
    const response = await fetch(url, headers).then(response => {
        return response.blob();
    });
    const arrayBuffer = await new Blob([response]).arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);
    try {
        const dataSet = dicomParser.parseDicom(byteArray);
        // console.log('dataSet :>> ', dataSet);
        return dataSet;
    } catch(error) {
        console.log(error);
        return undefined;
    }
}

// roi coordinate -> image data
export const roiCoordinateToImageData = (item, size) => {
    if(item) {
        const id = `layer-${item.dicom_object_uid}-${item.slice_num}-${item.frame}`;
        
        const canvas = __createCanvasElement(id, size);
        document.getElementById("__next").appendChild(canvas);
        const context = canvas.getContext("2d");
        
        context.fillStyle = "#000000";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // [기존 방법]
        // const coordinate_list = item.coordinate;
        // if(Array.isArray(coordinate_list)) {
        //     coordinate_list.forEach(coordinate => {
        //         if(Array.isArray(coordinate)) {
        //             context.beginPath();
        //             coordinate.forEach(point => {
        //                 const x = point[0];
        //                 const y = point[1];
        //                 context.lineTo(x, y);
        //             });
        //             context.closePath();
        //             context.fillStyle = '#FFFFFF';
        //             context.fill();
        //         }
        //     });
        // }
        
        // [업그레이드 방법]
        const eidtor_list = item.editor;
        if(Array.isArray(eidtor_list)) {
            eidtor_list.forEach(editor => {
                const coordinate = editor.coordinate;
                if(Array.isArray(coordinate)) {
                    context.beginPath();
                    coordinate.forEach(point => {
                        const x = point.x;
                        const y = point.y;
                        context.lineTo(x, y);
                    });
                    let composite = 'source-over';
                    if(editor.depth % 2 === 1) composite = 'destination-out';
                    context.globalCompositeOperation = composite;
                    context.closePath();
                    context.fillStyle = '#FFFFFF';
                    context.fill();
                }
            });
        }

        const imgData = canvas.toDataURL('image/png');
        return dataURItoBlob(imgData);
    } else {
        return __getEmptyCanvasImageData(size);
    }
}

// [내장함수] roi coordinate -> image data : ROI 빈 이미지 데이터 생성
const __getEmptyCanvasImageData = (size) => {
    const canvas = __createCanvasElement('empty_canvas', size);
    document.getElementById("__next").appendChild(canvas);
    const context = canvas.getContext("2d");
    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const imgData = canvas.toDataURL('image/png');
    canvas.remove();
    return dataURItoBlob(imgData);
}

// [내장함수] roi coordinate -> image data : 캔버스 태그 엘리먼트 생성
const __createCanvasElement = (id, size) => {
    const canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.style.position = "absolute";
    canvas.style.background = "#000000";
    canvas.style.top = `${(window.innerHeight / 2) - (canvas.height / 2)}px`;
    canvas.style.left = `${(window.innerWidth / 2) - (canvas.width / 2)}px`;
    canvas.style.visibility = 'hidden';
    return canvas;
}