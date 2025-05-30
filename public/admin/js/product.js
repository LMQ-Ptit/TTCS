// su ly logic phan front-end

//change status
const buttonsChangeStatus = document.querySelectorAll("[button-change-status]");

if (buttonsChangeStatus.length > 0) {
    const formChangeStatus = document.querySelector("#form-change-status");
    path=formChangeStatus.getAttribute("data-path");
    // console.log(path);

    buttonsChangeStatus.forEach(button => {
        button.addEventListener("click", () => {
            const statusCurrent = button.getAttribute("data-status");
            const id = button.getAttribute("data-id");

            let statusChange = statusCurrent === "active" ? "inactive" : "active";

            // console.log(statusCurrent);
            // console.log(id);
            // console.log(statusChange);
            const action=path+`/${statusChange}/${id}?_method=PATCH`;
            formChangeStatus.setAttribute("action", action);
            formChangeStatus.submit();
            
        });
    });
}
//end change status

//delete product
// Delete item
const buttonsDelete = document.querySelectorAll("[button-delete]");

if (buttonsDelete.length > 0) {
    const formDeleteItem = document.querySelector("#form-delete-item");
    const path=formDeleteItem.getAttribute("data-path");
    // console.log(path);
    buttonsDelete.forEach(button => {
        button.addEventListener("click", () => {
            const isConfirm = confirm("Bạn có chắc muốn xóa sản phẩm này?");

            if (isConfirm) {
                const id = button.getAttribute("data-id");
                const action=`${path}/${id}?_method=DELETE`;
                formDeleteItem.setAttribute("action", action);
                formDeleteItem.submit();
            }
        });
    });
}

//end delete product