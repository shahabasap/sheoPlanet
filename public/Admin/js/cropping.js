document.addEventListener("DOMContentLoaded", function () {
  const imagePreviews = document.querySelectorAll('[id^="imagePreviewContainer"]');
  const fileInputs = document.querySelectorAll('[id^="productImages"]');
  const fileInputArray = [document.getElementById("productImages-1"), document.getElementById("productImages-2"), document.getElementById("productImages-3"), document.getElementById("productImages-4")];

  fileInputs.forEach((fileInput, index) => {
    let originalFile;
    let croppedBlob;
    let cropper;
    let editButton;

    fileInput.addEventListener("change", function () {
      imagePreviews[index].innerHTML = "";

      Array.from(fileInput.files).forEach((file) => {
        originalFile = file;

        const reader = new FileReader();

        // Fix: Removed extra character 'c' here
        reader.onload = function (e) {
          const img = document.createElement("img");
          img.src = e.target.result;
          img.style.maxWidth = "100%";
          img.style.height = "auto";

          if (!editButton) {
            editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.addEventListener("click", function (event) {
              event.preventDefault();

              if (!cropper) {
                if (croppedBlob) {
                  const croppedImg = document.createElement("img");
                  croppedImg.src = URL.createObjectURL(croppedBlob);
                  croppedImg.style.maxWidth = "100%";
                  croppedImg.style.height = "auto";
                  imagePreviews[index].appendChild(croppedImg);
                }

                cropper = new Cropper(img, {
                  aspectRatio: 1,
                  viewMode: 1,
                  cropBoxResizable: false,
                  crop: function (event) {
                    // Do something with cropped data if needed
                  },
                });
              } else {
                cropper.replace(img);

                if (croppedBlob) {
                  const croppedImg = document.createElement("img");
                  croppedImg.src = URL.createObjectURL(croppedBlob);
                  croppedImg.style.maxWidth = "100%";
                  croppedImg.style.height = "auto";
                  imagePreviews[index].appendChild(croppedImg);
                }
              }

              const saveButton = document.createElement("button");
              saveButton.textContent = "Save";
              saveButton.addEventListener("click", function () {
                const timestamp = new Date().getTime();
                const uniqueFileName = `cropped_image_${timestamp}.jpg`;

                const canvas = cropper.getCroppedCanvas({
                  width: 500,
                  height: 500,
                });

                imagePreviews[index].innerHTML = "";
                imagePreviews[index].appendChild(canvas);

                croppedBlob = canvas.toBlob(function (blob) {
                  croppedBlob = blob;

                  cropper.crop();
                  editButton.remove();
                  cropper.destroy();
                  cropper = null;

                  const newFile = new File([blob], uniqueFileName);
                  const newFileList = new DataTransfer();
                  newFileList.items.add(newFile);
                  fileInput.files = newFileList.files;
                  console.log("files", fileInput.files);
                });
              });

              imagePreviews[index].appendChild(saveButton);
            });

            imagePreviews[index].appendChild(editButton);
          }

          imagePreviews[index].appendChild(img);
        };

        reader.readAsDataURL(file);
      });
    });
  });
});
