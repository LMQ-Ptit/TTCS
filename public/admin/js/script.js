// File nay su ly cac su kien frontend


// Button Status
// lay cac nut cos attribute button-status
const buttonsStatus = document.querySelectorAll("[button-status]");

if (buttonsStatus.length > 0) {
    // lay url hien tai
    let url = new URL(window.location.href);

    // them su kien click cho cac nut
    buttonsStatus.forEach(button => {
        button.addEventListener("click", () => {
            const status = button.getAttribute("button-status");

            if (status) {
                url.searchParams.set("status", status);
            } else {
                url.searchParams.delete("status");
            }
            // chuyen trang khi click
            window.location.href = url.href;
        });
    });
}
// End Button Status

// Form Search
const formSearch = document.querySelector("#form-search");
// console.log(formSearch);
if (formSearch) {
    let url = new URL(window.location.href);

    formSearch.addEventListener("submit", (e) => {
        // chan su kien submit mac dinh , de web k bi load lai giup dung dc ca bo loc va tim kiem
        e.preventDefault();
        // console.log(e)
        const keyword = e.target.elements.keyword.value;

        if (keyword) {
            url.searchParams.set("keyword", keyword);
        } else {
            url.searchParams.delete("keyword");
        }

        window.location.href = url.href;
    });
}

// End Form Search

//xu ly Phan trang 
const buttonsPagination = document.querySelectorAll("[button-pagination]");

if (buttonsPagination) {
    let url = new URL(window.location.href);

    buttonsPagination.forEach(button => {
        button.addEventListener("click", () => {
            const page = button.getAttribute("button-pagination");

            url.searchParams.set("page", page);

            window.location.href = url.href;
        });
    });
}

//end xu ly Phan trang

// Sort
const sort = document.querySelector("[sort]");
if (sort) {
    let url = new URL(window.location.href);

    const sortSelect = sort.querySelector("[sort-select]");
    const sortClear = sort.querySelector("[sort-clear]");

    sortSelect.addEventListener("change", (e) => {
        const value = e.target.value;
        const [sortKey, sortValue] = value.split("-");

        // console.log(sortKey);
        // console.log(sortValue);

        url.searchParams.set("sortKey", sortKey);
        url.searchParams.set("sortValue", sortValue);
        window.location.href= url.href;
    });

    //them su kien cho nut clear trang thai sort 
    sortClear.addEventListener("click", () => {
        url.searchParams.delete("sortKey");
        url.searchParams.delete("sortValue");
        window.location.href=url.href;
    })
    // Thêm selected cho option
    const sortKey = url.searchParams.get("sortKey");
    const sortValue = url.searchParams.get("sortValue");

    if (sortKey && sortValue) {
        const stringSort = `${sortKey}-${sortValue}`;
        // console.log(stringSort);
        
        const optionSelected = sortSelect.querySelector(`option[value='${stringSort}']`);
        
        if (optionSelected) {
            optionSelected.selected = true;
        }
    }
    // End Thêm selected cho option   
}

// End Sort

