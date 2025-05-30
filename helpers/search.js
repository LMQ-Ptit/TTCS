module.exports=(req)=>{
    // truy van theo keyword va them keyword vao find
    let search = {
        keyword: ""
    }
    if(req.query.keyword){
        search.keyword=req.query.keyword
        const regex = new RegExp(search.keyword, 'i');// tìm kiếm không phân biệt hoa thường
        search.regex=regex
    }
    return search
}