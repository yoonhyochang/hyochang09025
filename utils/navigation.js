/**
 * [복사] 내용 쓰기
 * 복사할 내용을 클립보드에 등록합니다.
 * 
 * @param {*} copy_content 복사 내용
 */
export function writeCopyData(copy_content) { 
    navigator.permissions.query({ name: 'clipboard-write' }).then((permission) => {
        if(permission.state === 'granted') {
            navigator.clipboard.writeText(copy_content)
            .then(() => {
                alert('내용이 복사되었습니다.');
            });
        } else {
            alert('클립보드의 접근 권한이 없어 내용을 복사할 수 없습니다.');
        }
    });
}