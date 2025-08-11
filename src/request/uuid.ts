// 随机数
const randomNum = (min: any, max: any) => {
    return parseInt(Math.random() * (max - min) + min)
}

export function createdUuid() {
    // 从本地取UUID，没有则生成一个，放请求头
    let uuid: any = localStorage.getItem('uuid');
    if (uuid === '' || uuid === undefined || uuid === null) {
        let uuid_str: any = new Date().getTime();
        let pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let temp_arr = [];
        for (let i = 0; i < 5; i++) {
            const text = pool[randomNum(0, pool.length)]
            temp_arr.push(text);
        }
        if (temp_arr.length > 0) {
            uuid_str = temp_arr.join("") + new Date().getTime();
        }
        localStorage.setItem('uuid', uuid_str);
        return uuid_str;
    } else {
        return uuid;
    }
}
