module.exports = (req,count,limit) => {
    let objectPagination = {
        currentPage: 1,
        limitItems: limit
    };
    
    if (req.query.page) {
        objectPagination.currentPage = parseInt(req.query.page);
    }
    // tim index dau tien cua moi trang
    objectPagination.skip = (objectPagination.currentPage - 1) * objectPagination.limitItems;
    
    //dem so luong trang
    const totalPage = Math.ceil(count / objectPagination.limitItems)
    objectPagination.totalPage = totalPage
    
    return objectPagination
}