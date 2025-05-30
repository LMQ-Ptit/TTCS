// Su li logic trang thai san pham 
module.exports=(req)=>{
    // Tao mang filterStatus chua trang thai hoat dong cua san pham
    let filterStatus = [
        {
            name:"Tat ca",
            status:"",
            class:''
        },
        {
            name:"Hoat dong",
            status:"active",
            class:''
        },
        {
            name:"Ngung hoat dong",
            status:"inactive",
            class:''
        }
    ]
    // Hien thi nut khi truy cap  
    if (req.query.status) {
        const index = filterStatus.findIndex(item => item.status == req.query.status);
        filterStatus[index].class = "active";
    }else{
        const index = filterStatus.findIndex(item => item.status == "");
        filterStatus[index].class = "active";
    }
    return filterStatus
}