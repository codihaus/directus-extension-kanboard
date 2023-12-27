export function formatDateTime (dataString: string) {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const date = new Date(dataString);
    const month = months[date.getMonth()];
    const day = date.getDate();
    let hour = date.getHours();
    const minute = date.getMinutes();
    const period = hour >= 12 ? 'pm' : 'am';

    hour = hour % 12 || 12;

    const formattedDate = `${month} ${day}, ${hour}:${(minute < 10 ? '0' : '') + minute}${period}`;
    return formattedDate;
}
export function convertToDisplayName(data: string) {
    // Tách chuỗi theo dấu gạch dưới và chuyển thành mảng các từ
    const words = data.split('_');
  
    // Chuyển đổi mỗi từ thành dạng viết hoa chữ cái đầu và ghép lại thành chuỗi
    const displayName = words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  
    return displayName;
  }